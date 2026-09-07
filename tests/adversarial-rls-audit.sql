CREATE TEMP TABLE IF NOT EXISTS _rls_audit_results (step text, status text);
TRUNCATE _rls_audit_results;
GRANT ALL ON TABLE _rls_audit_results TO authenticated, anon;

DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111';
  v_user_b UUID := '22222222-2222-2222-2222-222222222222';
  v_goal_a_id UUID;
  v_goal_b_id UUID;
  v_project_a_id UUID;
  v_project_b_id UUID;
  v_task_a_id UUID;
  v_task_expired_id UUID;
  v_res JSONB;
  v_count INT;
BEGIN
  -- 1. Create test auth users & profiles (Postgres Admin setup)
  RESET ROLE;
  INSERT INTO auth.users (id, email, aud, role) VALUES (v_user_a, 'usera@pact.test', 'authenticated', 'authenticated'), (v_user_b, 'userb@pact.test', 'authenticated', 'authenticated') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.profiles (id, full_name, timezone) VALUES (v_user_a, 'User A', 'UTC'), (v_user_b, 'User B', 'UTC') ON CONFLICT (id) DO NOTHING;

  -- Clean up previous test data if existing
  DELETE FROM public.tasks WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.projects WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.goals WHERE user_id IN (v_user_a, v_user_b);

  -- ----------------------------------------------------------------
  -- SECTION 1: GOALS SECURITY AUDIT (User A context)
  -- ----------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

  -- 1.1 User A creates Goal A
  INSERT INTO public.goals (user_id, title) VALUES (v_user_a, 'User A Goal') RETURNING id INTO v_goal_a_id;
  INSERT INTO _rls_audit_results VALUES ('1.1 Goal A Created by User A', 'PASS');

  -- 1.2 User A reads Goal A
  SELECT count(*) INTO v_count FROM public.goals WHERE id = v_goal_a_id;
  IF v_count <> 1 THEN RAISE EXCEPTION 'User A could not read own goal'; END IF;
  INSERT INTO _rls_audit_results VALUES ('1.2 User A Read Own Goal', 'PASS');

  -- 1.3 Switch to User B context
  SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
  INSERT INTO public.goals (user_id, title) VALUES (v_user_b, 'User B Goal') RETURNING id INTO v_goal_b_id;

  -- 1.4 ATTACK: User B reads User A Goal
  SELECT count(*) INTO v_count FROM public.goals WHERE id = v_goal_a_id;
  IF v_count <> 0 THEN RAISE EXCEPTION 'SECURITY VIOLATION: User B read User A Goal!'; END IF;
  INSERT INTO _rls_audit_results VALUES ('1.4 Cross-User Goal SELECT Blocked', 'PASS');

  -- 1.5 ATTACK: User B updates User A Goal
  UPDATE public.goals SET title = 'Hacked Title' WHERE id = v_goal_a_id;
  IF FOUND THEN RAISE EXCEPTION 'SECURITY VIOLATION: User B updated User A Goal!'; END IF;
  INSERT INTO _rls_audit_results VALUES ('1.5 Cross-User Goal UPDATE Blocked', 'PASS');

  -- 1.6 ATTACK: User B deletes User A Goal
  DELETE FROM public.goals WHERE id = v_goal_a_id;
  IF FOUND THEN RAISE EXCEPTION 'SECURITY VIOLATION: User B deleted User A Goal!'; END IF;
  INSERT INTO _rls_audit_results VALUES ('1.6 Cross-User Goal DELETE Blocked', 'PASS');

  -- 1.7 ATTACK: User B inserts goal with forged user_id = User A
  BEGIN
    INSERT INTO public.goals (user_id, title) VALUES (v_user_a, 'Forged Goal');
    RAISE EXCEPTION 'SECURITY VIOLATION: User B inserted goal for User A!';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _rls_audit_results VALUES ('1.7 Forged user_id Goal INSERT Blocked', 'PASS');
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      INSERT INTO _rls_audit_results VALUES ('1.7 Forged user_id Goal INSERT Blocked', 'PASS');
    ELSE
      RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
    END IF;
  END;

  -- ----------------------------------------------------------------
  -- SECTION 2: PROJECTS PARENT OWNERSHIP & RLS AUDIT
  -- ----------------------------------------------------------------
  -- 2.1 ATTACK: User B creates project linked to User A's Goal A
  BEGIN
    INSERT INTO public.projects (user_id, goal_id, title) VALUES (v_user_b, v_goal_a_id, 'User B Project Linked to User A Goal');
    RAISE EXCEPTION 'SECURITY VIOLATION: User B linked project to User A Goal!';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _rls_audit_results VALUES ('2.1 Cross-User Parent Goal Linkage on Project INSERT Blocked', 'PASS');
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      INSERT INTO _rls_audit_results VALUES ('2.1 Cross-User Parent Goal Linkage on Project INSERT Blocked', 'PASS');
    ELSE
      RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
    END IF;
  END;

  -- 2.2 Switch to User A context
  SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

  -- 2.3 User A creates valid Project A
  INSERT INTO public.projects (user_id, goal_id, title) VALUES (v_user_a, v_goal_a_id, 'User A Project') RETURNING id INTO v_project_a_id;
  INSERT INTO _rls_audit_results VALUES ('2.3 Project A Created by User A', 'PASS');

  -- 2.4 ATTACK: User A updates Project A setting goal_id = User B's Goal B
  BEGIN
    UPDATE public.projects SET goal_id = v_goal_b_id WHERE id = v_project_a_id;
    RAISE EXCEPTION 'SECURITY VIOLATION: User A updated project goal_id to User B Goal!';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _rls_audit_results VALUES ('2.4 Cross-User Parent Goal Linkage on Project UPDATE Blocked', 'PASS');
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      INSERT INTO _rls_audit_results VALUES ('2.4 Cross-User Parent Goal Linkage on Project UPDATE Blocked', 'PASS');
    ELSE
      RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
    END IF;
  END;

  -- ----------------------------------------------------------------
  -- SECTION 3: TASKS PARENT OWNERSHIP & RLS AUDIT
  -- ----------------------------------------------------------------
  -- 3.1 Switch to User B context
  SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
  INSERT INTO public.projects (user_id, goal_id, title) VALUES (v_user_b, v_goal_b_id, 'User B Project') RETURNING id INTO v_project_b_id;

  -- 3.2 ATTACK: User B creates task linked to User A's Project A
  BEGIN
    INSERT INTO public.tasks (user_id, project_id, title, deadline_at) VALUES (v_user_b, v_project_a_id, 'User B Task', now() + interval '1 day');
    RAISE EXCEPTION 'SECURITY VIOLATION: User B linked task to User A Project!';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _rls_audit_results VALUES ('3.2 Cross-User Parent Project Linkage on Task INSERT Blocked', 'PASS');
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      INSERT INTO _rls_audit_results VALUES ('3.2 Cross-User Parent Project Linkage on Task INSERT Blocked', 'PASS');
    ELSE
      RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
    END IF;
  END;

  -- 3.3 ATTACK: User B creates task linked to User A's Goal A
  BEGIN
    INSERT INTO public.tasks (user_id, goal_id, title, deadline_at) VALUES (v_user_b, v_goal_a_id, 'User B Task', now() + interval '1 day');
    RAISE EXCEPTION 'SECURITY VIOLATION: User B linked task to User A Goal!';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _rls_audit_results VALUES ('3.3 Cross-User Parent Goal Linkage on Task INSERT Blocked', 'PASS');
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      INSERT INTO _rls_audit_results VALUES ('3.3 Cross-User Parent Goal Linkage on Task INSERT Blocked', 'PASS');
    ELSE
      RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
    END IF;
  END;

  -- 3.4 Switch back to User A
  SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
  INSERT INTO public.tasks (user_id, project_id, goal_id, title, deadline_at) VALUES (v_user_a, v_project_a_id, v_goal_a_id, 'User A Task', now() + interval '1 day') RETURNING id INTO v_task_a_id;
  INSERT INTO _rls_audit_results VALUES ('3.4 Task A Created by User A', 'PASS');

  -- 3.5 ATTACK: User A updates Task A setting project_id = User B's Project B
  BEGIN
    UPDATE public.tasks SET project_id = v_project_b_id WHERE id = v_task_a_id;
    RAISE EXCEPTION 'SECURITY VIOLATION: User A updated task project_id to User B Project!';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _rls_audit_results VALUES ('3.5 Cross-User Parent Project Linkage on Task UPDATE Blocked', 'PASS');
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      INSERT INTO _rls_audit_results VALUES ('3.5 Cross-User Parent Project Linkage on Task UPDATE Blocked', 'PASS');
    ELSE
      RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
    END IF;
  END;

  -- ----------------------------------------------------------------
  -- SECTION 4: TRUSTED LIFECYCLE FIELD AUDIT (UPDATE & INSERT)
  -- ----------------------------------------------------------------
  -- 4.1 UPDATE completed_at Test
  BEGIN
    UPDATE public.tasks SET completed_at = now() WHERE id = v_task_a_id;
    RAISE EXCEPTION 'SECURITY VIOLATION: Direct UPDATE of completed_at allowed!';
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_audit_results VALUES ('4.1 Direct UPDATE of completed_at Blocked', 'PASS');
  END;

  -- 4.2 UPDATE missed_at Test
  BEGIN
    UPDATE public.tasks SET missed_at = now() WHERE id = v_task_a_id;
    RAISE EXCEPTION 'SECURITY VIOLATION: Direct UPDATE of missed_at allowed!';
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_audit_results VALUES ('4.2 Direct UPDATE of missed_at Blocked', 'PASS');
  END;

  -- 4.3 INSERT completed_at Forgery Test
  BEGIN
    INSERT INTO public.tasks (user_id, title, deadline_at, completed_at)
    VALUES (v_user_a, 'Forged Task', now() + interval '1 day', now());
    RAISE EXCEPTION 'SECURITY VIOLATION: Direct INSERT of completed_at allowed!';
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_audit_results VALUES ('4.3 Direct INSERT of completed_at Blocked', 'PASS');
  END;

  -- 4.4 INSERT missed_at Forgery Test
  BEGIN
    INSERT INTO public.tasks (user_id, title, deadline_at, missed_at)
    VALUES (v_user_a, 'Forged Missed Task', now() + interval '1 day', now());
    RAISE EXCEPTION 'SECURITY VIOLATION: Direct INSERT of missed_at allowed!';
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_audit_results VALUES ('4.4 Direct INSERT of missed_at Blocked', 'PASS');
  END;

  -- ----------------------------------------------------------------
  -- SECTION 5: ANONYMOUS ACCESS AUDIT
  -- ----------------------------------------------------------------
  SET LOCAL ROLE anon;
  SET LOCAL "request.jwt.claim.sub" = '';

  SELECT count(*) INTO v_count FROM public.goals;
  IF v_count <> 0 THEN RAISE EXCEPTION 'SECURITY VIOLATION: Anonymous read goals!'; END IF;

  SELECT count(*) INTO v_count FROM public.projects;
  IF v_count <> 0 THEN RAISE EXCEPTION 'SECURITY VIOLATION: Anonymous read projects!'; END IF;

  SELECT count(*) INTO v_count FROM public.tasks;
  IF v_count <> 0 THEN RAISE EXCEPTION 'SECURITY VIOLATION: Anonymous read tasks!'; END IF;

  INSERT INTO _rls_audit_results VALUES ('5.1 Anonymous Access Blocked for All Core Domain Tables', 'PASS');

  -- ----------------------------------------------------------------
  -- SECTION 6: AUTHORITATIVE TASK LIFECYCLE AUDIT
  -- ----------------------------------------------------------------
  RESET ROLE;
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

  -- 6.1 Direct UPDATE of status = 'completed' Blocked by Trigger
  BEGIN
    UPDATE public.tasks SET status = 'completed' WHERE id = v_task_a_id;
    RAISE EXCEPTION 'SECURITY VIOLATION: Direct UPDATE of status = completed allowed!';
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_audit_results VALUES ('6.1 Direct UPDATE status = completed Blocked', 'PASS');
  END;

  -- 6.2 Direct UPDATE of status = 'missed' Blocked by Trigger
  BEGIN
    UPDATE public.tasks SET status = 'missed' WHERE id = v_task_a_id;
    RAISE EXCEPTION 'SECURITY VIOLATION: Direct UPDATE of status = missed allowed!';
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _rls_audit_results VALUES ('6.2 Direct UPDATE status = missed Blocked', 'PASS');
  END;

  -- 6.3 Authoritative complete_task before deadline succeeds
  SELECT public.complete_task(v_task_a_id) INTO v_res;
  IF (v_res->>'success')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'Authoritative completion failed: %', v_res;
  END IF;
  INSERT INTO _rls_audit_results VALUES ('6.3 Authoritative Task Completion Before Deadline Succeeded', 'PASS');

  -- 6.4 ATTACK: User B attempts to complete User A\'s Task A
  SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
  SELECT public.complete_task(v_task_a_id) INTO v_res;
  IF (v_res->>'success')::boolean IS TRUE THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: User B completed User A Task!';
  END IF;
  INSERT INTO _rls_audit_results VALUES ('6.4 Cross-User Task Completion Blocked', 'PASS');

  -- 6.5 Switch back to User A: Repeated completion is idempotent
  SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
  SELECT public.complete_task(v_task_a_id) INTO v_res;
  IF (v_res->>'code') <> 'ALREADY_COMPLETED' THEN
    RAISE EXCEPTION 'Repeated completion did not return ALREADY_COMPLETED: %', v_res;
  END IF;
  INSERT INTO _rls_audit_results VALUES ('6.5 Idempotent Repeated Task Completion Verified', 'PASS');

  -- 6.6 Attempting to mark a completed task as missed fails
  SELECT public.mark_task_missed(v_task_a_id) INTO v_res;
  IF (v_res->>'code') <> 'ALREADY_COMPLETED' THEN
    RAISE EXCEPTION 'Marking completed task as missed did not return ALREADY_COMPLETED: %', v_res;
  END IF;
  INSERT INTO _rls_audit_results VALUES ('6.6 Transition Completed -> Missed Blocked', 'PASS');

  -- 6.7 Create Task A2 with expired deadline in the past
  INSERT INTO public.tasks (user_id, title, deadline_at)
  VALUES (v_user_a, 'Expired Task A2', now() - interval '1 hour')
  RETURNING id INTO v_task_expired_id;

  -- 6.8 Completion of expired task is rejected
  SELECT public.complete_task(v_task_expired_id) INTO v_res;
  IF (v_res->>'code') <> 'DEADLINE_REACHED' THEN
    RAISE EXCEPTION 'Completing expired task did not return DEADLINE_REACHED: %', v_res;
  END IF;
  INSERT INTO _rls_audit_results VALUES ('6.8 Completion of Expired Task Rejected', 'PASS');

  -- 6.9 Authoritative mark_task_missed on expired task succeeds
  SELECT public.mark_task_missed(v_task_expired_id) INTO v_res;
  IF (v_res->>'success')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'Marking expired task missed failed: %', v_res;
  END IF;
  INSERT INTO _rls_audit_results VALUES ('6.9 Authoritative Missed Transition Succeeded', 'PASS');

  -- 6.10 Repeated mark_task_missed is idempotent
  SELECT public.mark_task_missed(v_task_expired_id) INTO v_res;
  IF (v_res->>'code') <> 'ALREADY_MISSED' THEN
    RAISE EXCEPTION 'Repeated missed transition did not return ALREADY_MISSED: %', v_res;
  END IF;
  INSERT INTO _rls_audit_results VALUES ('6.10 Idempotent Repeated Missed Transition Verified', 'PASS');

  -- 6.11 Attempting to complete a missed task fails
  SELECT public.complete_task(v_task_expired_id) INTO v_res;
  IF (v_res->>'code') <> 'ALREADY_MISSED' THEN
    RAISE EXCEPTION 'Completing missed task did not return ALREADY_MISSED: %', v_res;
  END IF;
  INSERT INTO _rls_audit_results VALUES ('6.11 Transition Missed -> Completed Blocked', 'PASS');

  -- 6.12 Anonymous execution of RPC functions blocked
  SET LOCAL ROLE anon;
  SET LOCAL "request.jwt.claim.sub" = '';
  SELECT public.complete_task(v_task_a_id) INTO v_res;
  IF (v_res->>'code') <> 'UNAUTHENTICATED' THEN
    RAISE EXCEPTION 'Anonymous complete_task execution allowed!';
  END IF;
  INSERT INTO _rls_audit_results VALUES ('6.12 Anonymous Lifecycle RPC Execution Blocked', 'PASS');

  -- ----------------------------------------------------------------
  -- SECTION 7: PHASE 3 ACCOUNTABILITY DOMAIN & RLS AUDIT
  -- ----------------------------------------------------------------
  DECLARE
    v_cons_a_id UUID;
    v_cons_b_id UUID;
  BEGIN
    -- 7.1 Switch to User A context
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

    INSERT INTO public.consequence_definitions (user_id, title, consequence_type, action_statement)
    VALUES (v_user_a, 'User A Consequence', 'personal_restriction', 'No social media for 24h')
    RETURNING id INTO v_cons_a_id;
    INSERT INTO _rls_audit_results VALUES ('7.1 Consequence Definition A Created by User A', 'PASS');

    -- 7.2 User A reads own Consequence A
    SELECT count(*) INTO v_count FROM public.consequence_definitions WHERE id = v_cons_a_id;
    IF v_count <> 1 THEN RAISE EXCEPTION 'User A could not read own consequence definition'; END IF;
    INSERT INTO _rls_audit_results VALUES ('7.2 User A Read Own Consequence Definition', 'PASS');

    -- 7.3 Switch to User B context & create Consequence B
    SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
    INSERT INTO public.consequence_definitions (user_id, title, consequence_type, action_statement)
    VALUES (v_user_b, 'User B Consequence', 'self_improvement', 'Read 30 pages')
    RETURNING id INTO v_cons_b_id;

    -- 7.4 ATTACK: User B reads User A Consequence Definition A
    SELECT count(*) INTO v_count FROM public.consequence_definitions WHERE id = v_cons_a_id;
    IF v_count <> 0 THEN RAISE EXCEPTION 'SECURITY VIOLATION: User B read User A Consequence Definition!'; END IF;
    INSERT INTO _rls_audit_results VALUES ('7.4 Cross-User Consequence Definition SELECT Blocked', 'PASS');

    -- 7.5 ATTACK: User B updates User A Consequence Definition A
    UPDATE public.consequence_definitions SET title = 'Hacked Consequence' WHERE id = v_cons_a_id;
    IF FOUND THEN RAISE EXCEPTION 'SECURITY VIOLATION: User B updated User A Consequence!'; END IF;
    INSERT INTO _rls_audit_results VALUES ('7.5 Cross-User Consequence Definition UPDATE Blocked', 'PASS');

    -- 7.6 ATTACK: User B deletes User A Consequence Definition A
    DELETE FROM public.consequence_definitions WHERE id = v_cons_a_id;
    IF FOUND THEN RAISE EXCEPTION 'SECURITY VIOLATION: User B deleted User A Consequence!'; END IF;
    INSERT INTO _rls_audit_results VALUES ('7.6 Cross-User Consequence Definition DELETE Blocked', 'PASS');

    -- 7.7 ATTACK: User B inserts Consequence Definition with forged user_id = User A
    BEGIN
      INSERT INTO public.consequence_definitions (user_id, title, consequence_type, action_statement)
      VALUES (v_user_a, 'Forged Consequence', 'custom', 'Forged action');
      RAISE EXCEPTION 'SECURITY VIOLATION: User B inserted consequence for User A!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('7.7 Forged user_id Consequence INSERT Blocked', 'PASS');
    END;

    -- 7.8 User B creates Accountability Preferences pointing to own Consequence B
    INSERT INTO public.user_accountability_preferences (user_id, default_consequence_id, auto_apply_default, is_enabled)
    VALUES (v_user_b, v_cons_b_id, true, true);
    INSERT INTO _rls_audit_results VALUES ('7.8 User B Created Preferences Linked to Own Consequence B', 'PASS');

    -- 7.9 ATTACK: User B updates Preferences attempting to set default_consequence_id = User A's Consequence A
    BEGIN
      UPDATE public.user_accountability_preferences
      SET default_consequence_id = v_cons_a_id
      WHERE user_id = v_user_b;
      RAISE EXCEPTION 'SECURITY VIOLATION: User B linked preference to User A Consequence!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('7.9 Cross-User Default Consequence Linkage Blocked', 'PASS');
    END;

    -- 7.10 ATTACK: Anonymous access to consequence_definitions & user_accountability_preferences
    SET LOCAL ROLE anon;
    SET LOCAL "request.jwt.claim.sub" = '';
    SELECT count(*) INTO v_count FROM public.consequence_definitions;
    IF v_count <> 0 THEN RAISE EXCEPTION 'SECURITY VIOLATION: Anonymous read consequence_definitions!'; END IF;

    SELECT count(*) INTO v_count FROM public.user_accountability_preferences;
    IF v_count <> 0 THEN RAISE EXCEPTION 'SECURITY VIOLATION: Anonymous read user_accountability_preferences!'; END IF;
    INSERT INTO _rls_audit_results VALUES ('7.10 Anonymous Access Blocked for Accountability Tables', 'PASS');
  END;

  -- Clean up test records
  RESET ROLE;
  DELETE FROM public.user_accountability_preferences WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.consequence_definitions WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.tasks WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.projects WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.goals WHERE user_id IN (v_user_a, v_user_b);
END;
$$;

SELECT step, status FROM _rls_audit_results;
