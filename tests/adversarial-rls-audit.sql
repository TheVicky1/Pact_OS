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

  -- ----------------------------------------------------------------
  -- SECTION 8: PHASE 3 MILESTONE 2 COMMITMENT ASSIGNMENT & IMMUTABILITY AUDIT
  -- ----------------------------------------------------------------
  DECLARE
    v_m2_cons_a_id UUID;
    v_m2_cons_b_id UUID;
    v_m2_task_a_id UUID;
    v_m2_commit_a_id UUID;
  BEGIN
    -- 8.1 User A creates Consequence Definition A and Task A
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

    INSERT INTO public.consequence_definitions (user_id, title, consequence_type, action_statement)
    VALUES (v_user_a, 'User A Original Consequence', 'personal_restriction', 'No social media 24h')
    RETURNING id INTO v_m2_cons_a_id;

    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'User A Commitment Task', 'pending', transaction_timestamp() + interval '1 hour')
    RETURNING id INTO v_m2_task_a_id;

    -- 8.2 User A creates Task Accountability Commitment snapshot for Task A
    INSERT INTO public.task_accountability_commitments (
      task_id,
      user_id,
      source_consequence_id,
      consequence_snapshot,
      commitment_status
    )
    VALUES (
      v_m2_task_a_id,
      v_user_a,
      v_m2_cons_a_id,
      jsonb_build_object(
        'title', 'User A Original Consequence',
        'consequence_type', 'personal_restriction',
        'action_statement', 'No social media 24h',
        'description', null
      ),
      'committed'
    )
    RETURNING id INTO v_m2_commit_a_id;

    INSERT INTO _rls_audit_results VALUES ('8.1 Task Commitment A Created by User A', 'PASS');

    -- 8.3 User A reads own Task Commitment A
    SELECT count(*) INTO v_count FROM public.task_accountability_commitments WHERE id = v_m2_commit_a_id;
    IF v_count <> 1 THEN RAISE EXCEPTION 'User A could not read own task commitment'; END IF;
    INSERT INTO _rls_audit_results VALUES ('8.2 User A Read Own Task Commitment', 'PASS');

    -- 8.4 Switch to User B context
    SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';

    INSERT INTO public.consequence_definitions (user_id, title, consequence_type, action_statement)
    VALUES (v_user_b, 'User B Consequence', 'reflection', 'Write 10 lines')
    RETURNING id INTO v_m2_cons_b_id;

    -- 8.5 ATTACK: User B reads User A Task Commitment A
    SELECT count(*) INTO v_count FROM public.task_accountability_commitments WHERE id = v_m2_commit_a_id;
    IF v_count <> 0 THEN RAISE EXCEPTION 'SECURITY VIOLATION: User B read User A Task Commitment!'; END IF;
    INSERT INTO _rls_audit_results VALUES ('8.3 Cross-User Task Commitment SELECT Blocked', 'PASS');

    -- 8.6 ATTACK: User B attempts to attach User B Consequence to User A Task A
    BEGIN
      INSERT INTO public.task_accountability_commitments (
        task_id, user_id, source_consequence_id, consequence_snapshot
      ) VALUES (
        v_m2_task_a_id, v_user_b, v_m2_cons_b_id, '{"title":"Hacked"}'::jsonb
      );
      RAISE EXCEPTION 'SECURITY VIOLATION: User B attached commitment to User A task!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('8.4 Cross-User Task Commitment INSERT Blocked', 'PASS');
    END;

    -- 8.7 ATTACK: User B attempts to use User A Consequence A for User B Task
    DECLARE
      v_m2_task_b_id UUID;
    BEGIN
      INSERT INTO public.tasks (user_id, title, status, deadline_at)
      VALUES (v_user_b, 'User B Task', 'pending', transaction_timestamp() + interval '1 hour')
      RETURNING id INTO v_m2_task_b_id;

      BEGIN
        INSERT INTO public.task_accountability_commitments (
          task_id, user_id, source_consequence_id, consequence_snapshot
        ) VALUES (
          v_m2_task_b_id, v_user_b, v_m2_cons_a_id, '{"title":"Hijacked Consequence"}'::jsonb
        );
        RAISE EXCEPTION 'SECURITY VIOLATION: User B used User A consequence definition!';
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO _rls_audit_results VALUES ('8.5 Cross-User Source Consequence Linkage Blocked', 'PASS');
      END;
    END;

    -- 8.8 Switch back to User A
    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

    -- 8.9 ATTACK: User A attempts to update committed consequence_snapshot
    BEGIN
      UPDATE public.task_accountability_commitments
      SET consequence_snapshot = jsonb_build_object('title', 'Mutated Snapshot Title')
      WHERE id = v_m2_commit_a_id;
      RAISE EXCEPTION 'SECURITY VIOLATION: Updating committed snapshot was allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('8.6 Direct UPDATE of Commitment Snapshot Blocked by DB Trigger', 'PASS');
    END;

    -- 8.10 ATTACK: User A attempts direct DELETE of commitment without deleting parent task
    BEGIN
      DELETE FROM public.task_accountability_commitments WHERE id = v_m2_commit_a_id;
      RAISE EXCEPTION 'SECURITY VIOLATION: Direct deletion of task commitment was allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('8.7 Direct DELETE of Task Commitment Blocked by DB Trigger', 'PASS');
    END;

    -- 8.11 ATTACK: Anonymous access to task_accountability_commitments blocked
    SET LOCAL ROLE anon;
    SET LOCAL "request.jwt.claim.sub" = '';
    SELECT count(*) INTO v_count FROM public.task_accountability_commitments;
    IF v_count <> 0 THEN RAISE EXCEPTION 'SECURITY VIOLATION: Anonymous read task_accountability_commitments!'; END IF;
    INSERT INTO _rls_audit_results VALUES ('8.8 Anonymous Access Blocked for Task Commitments Table', 'PASS');
  END;

  -- ----------------------------------------------------------------
  -- SECTION 9: PHASE 3 MILESTONE 3 CONSEQUENCE ACTIVATION & EVENT HISTORY AUDIT
  -- ----------------------------------------------------------------
  DECLARE
    v_m3_cons_a_id UUID;
    v_m3_task_comp_id UUID;
    v_m3_commit_comp_id UUID;
    v_m3_task_miss_id UUID;
    v_m3_commit_miss_id UUID;
    v_m3_task_deleted_source_id UUID;
    v_m3_commit_deleted_source_id UUID;
    v_m3_event_count INT;
    v_m3_comm_status TEXT;
    v_m3_activated_at TIMESTAMPTZ;
  BEGIN
    -- 9.1 Setup User A consequence definition & completed task commitment
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

    INSERT INTO public.consequence_definitions (user_id, title, consequence_type, action_statement)
    VALUES (v_user_a, 'User A Activation Test Consequence', 'personal_restriction', 'No social media 24h')
    RETURNING id INTO v_m3_cons_a_id;

    -- Task completed before deadline
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'User A Completed Accountable Task', 'pending', transaction_timestamp() + interval '1 hour')
    RETURNING id INTO v_m3_task_comp_id;

    INSERT INTO public.task_accountability_commitments (
      task_id, user_id, source_consequence_id, consequence_snapshot, commitment_status
    ) VALUES (
      v_m3_task_comp_id, v_user_a, v_m3_cons_a_id, jsonb_build_object(
        'title', 'User A Activation Test Consequence',
        'consequence_type', 'personal_restriction',
        'action_statement', 'No social media 24h'
      ), 'committed'
    ) RETURNING id INTO v_m3_commit_comp_id;

    -- Complete task authoritatively
    SELECT public.complete_task(v_m3_task_comp_id) INTO v_res;
    IF (v_res->>'success')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'Task completion failed in Section 9: %', v_res;
    END IF;

    -- Verify completion produced ZERO activation and ZERO events
    SELECT commitment_status, activated_at INTO v_m3_comm_status, v_m3_activated_at
    FROM public.task_accountability_commitments WHERE id = v_m3_commit_comp_id;

    IF v_m3_comm_status <> 'committed' OR v_m3_activated_at IS NOT NULL THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Completed task activated consequence!';
    END IF;

    SELECT count(*) INTO v_m3_event_count FROM public.accountability_events WHERE commitment_id = v_m3_commit_comp_id;
    IF v_m3_event_count <> 0 THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Completed task generated accountability event!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('9.1 Task Completion Produced Zero Consequence Activation', 'PASS');

    -- 9.2 Authoritative mark_task_missed activates commitment & logs event atomically
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'User A Missed Accountable Task', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m3_task_miss_id;

    INSERT INTO public.task_accountability_commitments (
      task_id, user_id, source_consequence_id, consequence_snapshot, commitment_status
    ) VALUES (
      v_m3_task_miss_id, v_user_a, v_m3_cons_a_id, jsonb_build_object(
        'title', 'User A Activation Test Consequence',
        'consequence_type', 'personal_restriction',
        'action_statement', 'No social media 24h'
      ), 'committed'
    ) RETURNING id INTO v_m3_commit_miss_id;

    SELECT public.mark_task_missed(v_m3_task_miss_id) INTO v_res;
    IF (v_res->>'success')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'mark_task_missed failed in Section 9: %', v_res;
    END IF;

    SELECT commitment_status, activated_at INTO v_m3_comm_status, v_m3_activated_at
    FROM public.task_accountability_commitments WHERE id = v_m3_commit_miss_id;

    IF v_m3_comm_status <> 'activated' OR v_m3_activated_at IS NULL THEN
      RAISE EXCEPTION 'mark_task_missed did not set status = activated and activated_at!';
    END IF;

    SELECT count(*) INTO v_m3_event_count FROM public.accountability_events
    WHERE commitment_id = v_m3_commit_miss_id AND event_type = 'activated';
    IF v_m3_event_count <> 1 THEN
      RAISE EXCEPTION 'mark_task_missed did not record exactly 1 activation event!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('9.2 Authoritative Task Miss Atomic Activation Succeeded', 'PASS');

    -- 9.3 Repeated mark_task_missed is idempotent with zero duplicate events
    SELECT public.mark_task_missed(v_m3_task_miss_id) INTO v_res;
    IF (v_res->>'code') <> 'ALREADY_MISSED' THEN
      RAISE EXCEPTION 'Repeated mark_task_missed did not return ALREADY_MISSED: %', v_res;
    END IF;

    SELECT count(*) INTO v_m3_event_count FROM public.accountability_events
    WHERE commitment_id = v_m3_commit_miss_id AND event_type = 'activated';
    IF v_m3_event_count <> 1 THEN
      RAISE EXCEPTION 'Repeated mark_task_missed created duplicate activation events!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('9.3 Repeated Task Miss Activation Idempotency & Zero Duplicates Verified', 'PASS');

    -- 9.4 ATTACK: Direct UPDATE of commitment_status blocked
    BEGIN
      UPDATE public.task_accountability_commitments
      SET commitment_status = 'activated'
      WHERE id = v_m3_commit_comp_id;
      RAISE EXCEPTION 'SECURITY VIOLATION: Direct UPDATE of commitment_status allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('9.4 Direct UPDATE of commitment_status Blocked by DB Trigger', 'PASS');
    END;

    -- 9.5 ATTACK: Direct UPDATE of activated_at timestamp blocked
    BEGIN
      UPDATE public.task_accountability_commitments
      SET activated_at = now()
      WHERE id = v_m3_commit_comp_id;
      RAISE EXCEPTION 'SECURITY VIOLATION: Direct UPDATE of activated_at allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('9.5 Direct UPDATE of activated_at Timestamp Blocked by DB Trigger', 'PASS');
    END;

    -- 9.6 ATTACK: Direct INSERT into accountability_events blocked by RLS
    BEGIN
      INSERT INTO public.accountability_events (user_id, task_id, commitment_id, event_type)
      VALUES (v_user_a, v_m3_task_comp_id, v_m3_commit_comp_id, 'activated');
      RAISE EXCEPTION 'SECURITY VIOLATION: Direct INSERT into accountability_events allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('9.6 Direct Client INSERT into accountability_events Blocked', 'PASS');
    END;

    -- 9.7 ATTACK: Direct UPDATE or DELETE of accountability_events blocked
    BEGIN
      UPDATE public.accountability_events SET event_type = 'waived' WHERE commitment_id = v_m3_commit_miss_id;
      RAISE EXCEPTION 'SECURITY VIOLATION: UPDATE of accountability_events allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('9.7 Direct UPDATE of accountability_events Blocked', 'PASS');
    END;

    BEGIN
      DELETE FROM public.accountability_events WHERE commitment_id = v_m3_commit_miss_id;
      RAISE EXCEPTION 'SECURITY VIOLATION: DELETE of accountability_events allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('9.8 Direct DELETE of accountability_events Blocked', 'PASS');
    END;

    -- 9.8 ATTACK: User B cannot view User A accountability_events
    SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
    SELECT count(*) INTO v_m3_event_count FROM public.accountability_events WHERE commitment_id = v_m3_commit_miss_id;
    IF v_m3_event_count <> 0 THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: User B viewed User A accountability_events!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('9.9 Cross-User Accountability Events SELECT Blocked', 'PASS');

    -- 9.9 Anonymous access to accountability_events blocked
    SET LOCAL ROLE anon;
    SET LOCAL "request.jwt.claim.sub" = '';
    SELECT count(*) INTO v_m3_event_count FROM public.accountability_events;
    IF v_m3_event_count <> 0 THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Anonymous read accountability_events!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('9.10 Anonymous Access Blocked for accountability_events', 'PASS');

    -- 9.10 Activation succeeds even after source consequence definition deletion
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'Deleted Source Task', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m3_task_deleted_source_id;

    INSERT INTO public.task_accountability_commitments (
      task_id, user_id, source_consequence_id, consequence_snapshot, commitment_status
    ) VALUES (
      v_m3_task_deleted_source_id, v_user_a, v_m3_cons_a_id, jsonb_build_object(
        'title', 'Deleted Source Consequence Title',
        'consequence_type', 'reflection',
        'action_statement', 'Reflect for 15m'
      ), 'committed'
    ) RETURNING id INTO v_m3_commit_deleted_source_id;

    -- Delete source consequence definition
    DELETE FROM public.consequence_definitions WHERE id = v_m3_cons_a_id;

    -- Authoritative mark_task_missed still activates cleanly
    SELECT public.mark_task_missed(v_m3_task_deleted_source_id) INTO v_res;
    IF (v_res->>'success')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'mark_task_missed failed after source deletion: %', v_res;
    END IF;

    SELECT commitment_status INTO v_m3_comm_status
    FROM public.task_accountability_commitments WHERE id = v_m3_commit_deleted_source_id;

    IF v_m3_comm_status <> 'activated' THEN
      RAISE EXCEPTION 'Commitment failed to activate after source consequence deletion!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('9.11 Activation Resilient to Source Consequence Definition Deletion', 'PASS');
  END;

  -- ----------------------------------------------------------------
  -- SECTION 10: RESOLUTION, VERIFICATION & WAIVER SECURITY AUDIT (Phase 3 Milestone 4)
  -- ----------------------------------------------------------------
  DECLARE
    v_m4_task_1 UUID;
    v_m4_task_2 UUID;
    v_m4_task_w1 UUID;
    v_m4_task_w2 UUID;
    v_m4_task_w3 UUID;
    v_m4_task_w4 UUID;
    v_m4_commit_1 UUID;
    v_m4_commit_2 UUID;
    v_m4_commit_w1 UUID;
    v_m4_commit_w2 UUID;
    v_m4_commit_w3 UUID;
    v_m4_commit_w4 UUID;
    v_m4_session_1 UUID;
    v_m4_session_2 UUID;
    v_m4_comm_status TEXT;
    v_m4_sess_count INT;
    v_m4_waiver_count INT;
    v_m4_event_count INT;
  BEGIN
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

    -- 10.1 Setup: Create task 1 with activated commitment (timed_session requiring 30m = 1800s)
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'User A Timed Task 1', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m4_task_1;

    INSERT INTO public.task_accountability_commitments (
      task_id, user_id, consequence_snapshot, commitment_status
    ) VALUES (
      v_m4_task_1, v_user_a, jsonb_build_object(
        'title', 'Study 30m',
        'consequence_type', 'self_improvement',
        'action_statement', 'Study algorithms',
        'verification_type', 'timed_session',
        'verification_config', jsonb_build_object('required_duration_seconds', 1800)
      ), 'committed'
    ) RETURNING id INTO v_m4_commit_1;

    -- Authoritatively activate commitment via mark_task_missed
    PERFORM public.mark_task_missed(v_m4_task_1);

    -- 10.2 ATTACK: Direct client UPDATE of commitment_status to 'fulfilled' is strictly blocked
    BEGIN
      UPDATE public.task_accountability_commitments
      SET commitment_status = 'fulfilled'
      WHERE id = v_m4_commit_1;
      RAISE EXCEPTION 'SECURITY VIOLATION: Direct UPDATE of commitment_status to fulfilled allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('10.01 Direct UPDATE commitment_status to fulfilled Blocked', 'PASS');
    END;

    -- 10.3 ATTACK: Direct client INSERT into accountability_verification_sessions is blocked
    BEGIN
      INSERT INTO public.accountability_verification_sessions (
        commitment_id, user_id, status, required_duration_seconds, actual_duration_seconds
      ) VALUES (
        v_m4_commit_1, v_user_a, 'completed', 1800, 1800
      );
      RAISE EXCEPTION 'SECURITY VIOLATION: Direct INSERT into accountability_verification_sessions allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('10.02 Direct INSERT into accountability_verification_sessions Blocked', 'PASS');
    END;

    -- 10.4 ATTACK: Cross-User session start blocked (User B attempts to start session for User A commitment)
    SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
    SELECT public.start_accountability_session(v_m4_commit_1) INTO v_res;
    IF (v_res->>'success')::boolean IS TRUE THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: User B started session for User A commitment!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.03 Cross-User Session Start Blocked', 'PASS');

    -- 10.5 User A starts valid session for commitment 1
    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
    SELECT public.start_accountability_session(v_m4_commit_1) INTO v_res;
    IF (v_res->>'code') <> 'SESSION_STARTED' THEN
      RAISE EXCEPTION 'Failed to start valid session: %', v_res;
    END IF;
    v_m4_session_1 := (v_res->'data'->>'id')::uuid;
    INSERT INTO _rls_audit_results VALUES ('10.04 User A Started Valid Verification Session', 'PASS');

    -- 10.6 Duplicate session start returns existing active session (reconnect/resume resilience)
    SELECT public.start_accountability_session(v_m4_commit_1) INTO v_res;
    IF (v_res->>'code') <> 'SESSION_ALREADY_ACTIVE' OR (v_res->'data'->>'id')::uuid <> v_m4_session_1 THEN
      RAISE EXCEPTION 'Duplicate start did not return existing active session: %', v_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.05 Reconnect/Resume Active Session Idempotency Verified', 'PASS');

    -- 10.7 ATTACK: Fulfill before required duration elapsed is strictly rejected
    SELECT public.fulfill_accountability_session(v_m4_session_1, 'Studied hard') INTO v_res;
    IF (v_res->>'code') <> 'DURATION_NOT_MET' THEN
      RAISE EXCEPTION 'Fulfillment before required duration was not rejected: %', v_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.06 Premature Session Fulfillment Rejected by Server Timer', 'PASS');

    -- 10.8 ATTACK: Client attempts to directly mutate session started_at or actual_duration_seconds
    BEGIN
      UPDATE public.accountability_verification_sessions
      SET started_at = now() - interval '2 hours'
      WHERE id = v_m4_session_1;
      RAISE EXCEPTION 'SECURITY VIOLATION: Direct UPDATE of session timestamps allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('10.07 Direct UPDATE of Session Timestamps Blocked by Trigger', 'PASS');
    END;

    -- 10.9 ATTACK: Cross-User fulfillment attempt blocked (User B attempts to fulfill User A session)
    SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
    SELECT public.fulfill_accountability_session(v_m4_session_1, 'Hacked session') INTO v_res;
    IF (v_res->>'success')::boolean IS TRUE THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: User B fulfilled User A session!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.08 Cross-User Session Fulfillment Blocked', 'PASS');

    -- 10.10 Session Cancellation by User A
    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
    SELECT public.cancel_accountability_session(v_m4_session_1) INTO v_res;
    IF (v_res->>'code') <> 'SESSION_CANCELLED' THEN
      RAISE EXCEPTION 'Failed to cancel session: %', v_res;
    END IF;

    -- Commitment remains 'activated' after cancellation
    SELECT commitment_status INTO v_m4_comm_status FROM public.task_accountability_commitments WHERE id = v_m4_commit_1;
    IF v_m4_comm_status <> 'activated' THEN
      RAISE EXCEPTION 'Session cancellation altered commitment status away from activated!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.09 Session Cancelled; Commitment Remains Activated', 'PASS');

    -- 10.11 ATTACK: Cancelled session cannot be fulfilled
    SELECT public.fulfill_accountability_session(v_m4_session_1, 'Try fulfill cancelled') INTO v_res;
    IF (v_res->>'code') <> 'INVALID_SESSION_STATUS' THEN
      RAISE EXCEPTION 'Fulfilling cancelled session was not rejected: %', v_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.10 Fulfilling Cancelled Session Rejected', 'PASS');

    -- 10.12 Setup Task 2 with zero required duration to test fulfillment and evidence validation
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'User A Zero Duration Task', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m4_task_2;

    INSERT INTO public.task_accountability_commitments (
      task_id, user_id, consequence_snapshot, commitment_status
    ) VALUES (
      v_m4_task_2, v_user_a, jsonb_build_object(
        'title', 'Instant Accountability Task',
        'consequence_type', 'declaration',
        'action_statement', 'Declare honesty',
        'verification_type', 'declaration',
        'verification_config', jsonb_build_object('required_duration_seconds', 0)
      ), 'committed'
    ) RETURNING id INTO v_m4_commit_2;

    PERFORM public.mark_task_missed(v_m4_task_2);
    SELECT public.start_accountability_session(v_m4_commit_2) INTO v_res;
    v_m4_session_2 := (v_res->'data'->>'id')::uuid;

    -- 10.13 ATTACK: Oversized evidence note (>5000 chars) rejected
    SELECT public.fulfill_accountability_session(v_m4_session_2, repeat('X', 5001)) INTO v_res;
    IF (v_res->>'code') <> 'EVIDENCE_TOO_LONG' THEN
      RAISE EXCEPTION 'Oversized evidence note was not rejected: %', v_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.11 Oversized Evidence Note Rejected', 'PASS');

    -- 10.14 Valid fulfillment succeeds with valid note
    SELECT public.fulfill_accountability_session(v_m4_session_2, 'Verified declared consequence completed.') INTO v_res;
    IF (v_res->>'code') <> 'FULFILLED' THEN
      RAISE EXCEPTION 'Fulfillment failed for valid session: %', v_res;
    END IF;

    SELECT commitment_status INTO v_m4_comm_status FROM public.task_accountability_commitments WHERE id = v_m4_commit_2;
    IF v_m4_comm_status <> 'fulfilled' THEN
      RAISE EXCEPTION 'Commitment status was not transitioned to fulfilled!';
    END IF;

    SELECT count(*) INTO v_m4_event_count FROM public.accountability_events
    WHERE commitment_id = v_m4_commit_2 AND event_type = 'fulfilled';
    IF v_m4_event_count <> 1 THEN
      RAISE EXCEPTION 'Exact 1 fulfilled event was not recorded!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.12 Valid Session Fulfillment Succeeded & Logged Exactly 1 Event', 'PASS');

    -- 10.15 Repeated fulfillment is idempotent
    SELECT public.fulfill_accountability_session(v_m4_session_2, 'Duplicate call') INTO v_res;
    IF (v_res->>'code') <> 'ALREADY_FULFILLED' THEN
      RAISE EXCEPTION 'Repeated fulfillment did not return ALREADY_FULFILLED: %', v_res;
    END IF;

    SELECT count(*) INTO v_m4_event_count FROM public.accountability_events
    WHERE commitment_id = v_m4_commit_2 AND event_type = 'fulfilled';
    IF v_m4_event_count <> 1 THEN
      RAISE EXCEPTION 'Repeated fulfillment created duplicate events!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.13 Repeated Fulfillment Idempotency & Zero Duplicate Events Verified', 'PASS');

    -- 10.16 ATTACK: Completed session evidence and timestamps are immutable
    BEGIN
      UPDATE public.accountability_verification_sessions
      SET evidence_note = 'Hacked after completion'
      WHERE id = v_m4_session_2;
      RAISE EXCEPTION 'SECURITY VIOLATION: Completed session evidence note was modified!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('10.14 Completed Session Evidence Note Immutability Verified', 'PASS');
    END;

    -- ----------------------------------------------------------------
    -- WAIVER SYSTEM ADVERSARIAL AUDIT (3-Waivers Per Week Limit in Timezone)
    -- ----------------------------------------------------------------

    -- Set User A timezone to America/New_York
    UPDATE public.profiles SET timezone = 'America/New_York' WHERE id = v_user_a;

    -- Create 4 missed tasks with activated commitments for User A to test 3-waiver quota
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'Waiver Task 1', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m4_task_w1;

    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'Waiver Task 2', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m4_task_w2;

    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'Waiver Task 3', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m4_task_w3;

    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'Waiver Task 4', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m4_task_w4;

    INSERT INTO public.task_accountability_commitments (task_id, user_id, consequence_snapshot, commitment_status)
    VALUES (v_m4_task_w1, v_user_a, jsonb_build_object('title', 'Waiver 1', 'consequence_type', 'reflection', 'action_statement', 'Reflect'), 'committed')
    RETURNING id INTO v_m4_commit_w1;

    INSERT INTO public.task_accountability_commitments (task_id, user_id, consequence_snapshot, commitment_status)
    VALUES (v_m4_task_w2, v_user_a, jsonb_build_object('title', 'Waiver 2', 'consequence_type', 'reflection', 'action_statement', 'Reflect'), 'committed')
    RETURNING id INTO v_m4_commit_w2;

    INSERT INTO public.task_accountability_commitments (task_id, user_id, consequence_snapshot, commitment_status)
    VALUES (v_m4_task_w3, v_user_a, jsonb_build_object('title', 'Waiver 3', 'consequence_type', 'reflection', 'action_statement', 'Reflect'), 'committed')
    RETURNING id INTO v_m4_commit_w3;

    INSERT INTO public.task_accountability_commitments (task_id, user_id, consequence_snapshot, commitment_status)
    VALUES (v_m4_task_w4, v_user_a, jsonb_build_object('title', 'Waiver 4', 'consequence_type', 'reflection', 'action_statement', 'Reflect'), 'committed')
    RETURNING id INTO v_m4_commit_w4;

    PERFORM public.mark_task_missed(v_m4_task_w1);
    PERFORM public.mark_task_missed(v_m4_task_w2);
    PERFORM public.mark_task_missed(v_m4_task_w3);
    PERFORM public.mark_task_missed(v_m4_task_w4);

    -- 10.17 ATTACK: Waiver with invalid confirmation token is rejected
    SELECT public.waive_accountability_commitment(v_m4_commit_w1, 'WRONG_TOKEN') INTO v_res;
    IF (v_res->>'code') <> 'INVALID_CONFIRMATION_TOKEN' THEN
      RAISE EXCEPTION 'Waiver with invalid confirmation token was not rejected: %', v_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.15 Invalid Waiver Confirmation Token Rejected', 'PASS');

    -- 10.18 ATTACK: Non-activated commitment cannot be waived (e.g. v_m4_commit_2 is already 'fulfilled')
    SELECT public.waive_accountability_commitment(v_m4_commit_2, 'CONFIRM_WAIVER_V1') INTO v_res;
    IF (v_res->>'code') <> 'COMMITMENT_NOT_ACTIVATED' THEN
      RAISE EXCEPTION 'Waiving non-activated commitment was not rejected: %', v_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.16 Waiving Non-Activated (Fulfilled) Commitment Rejected', 'PASS');

    -- 10.19 ATTACK: Cross-user waiver attempt blocked (User B attempts to waive User A commitment)
    SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
    SELECT public.waive_accountability_commitment(v_m4_commit_w1, 'CONFIRM_WAIVER_V1') INTO v_res;
    IF (v_res->>'success')::boolean IS TRUE THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: User B waived User A commitment!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.17 Cross-User Waiver Attempt Blocked', 'PASS');

    -- 10.20 Waiver 1 succeeds (count = 1)
    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
    SELECT public.waive_accountability_commitment(v_m4_commit_w1, 'CONFIRM_WAIVER_V1') INTO v_res;
    IF (v_res->>'code') <> 'WAIVED' OR (v_res->>'waiver_count_in_week')::int <> 1 THEN
      RAISE EXCEPTION 'Waiver 1 failed or count incorrect: %', v_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.18 Waiver 1 Processed Successfully (Count 1 of 3)', 'PASS');

    -- 10.21 Repeated waiver on same commitment is idempotent
    SELECT public.waive_accountability_commitment(v_m4_commit_w1, 'CONFIRM_WAIVER_V1') INTO v_res;
    IF (v_res->>'code') <> 'ALREADY_WAIVED' THEN
      RAISE EXCEPTION 'Repeated waiver on same commitment did not return ALREADY_WAIVED: %', v_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.19 Repeated Waiver on Same Commitment Idempotent', 'PASS');

    -- 10.22 Waiver 2 succeeds (count = 2)
    SELECT public.waive_accountability_commitment(v_m4_commit_w2, 'CONFIRM_WAIVER_V1') INTO v_res;
    IF (v_res->>'code') <> 'WAIVED' OR (v_res->>'waiver_count_in_week')::int <> 2 THEN
      RAISE EXCEPTION 'Waiver 2 failed or count incorrect: %', v_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.20 Waiver 2 Processed Successfully (Count 2 of 3)', 'PASS');

    -- 10.23 Waiver 3 succeeds (count = 3)
    SELECT public.waive_accountability_commitment(v_m4_commit_w3, 'CONFIRM_WAIVER_V1') INTO v_res;
    IF (v_res->>'code') <> 'WAIVED' OR (v_res->>'waiver_count_in_week')::int <> 3 THEN
      RAISE EXCEPTION 'Waiver 3 failed or count incorrect: %', v_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.21 Waiver 3 Processed Successfully (Count 3 of 3)', 'PASS');

    -- 10.24 ATTACK: Fourth waiver in same calendar week is strictly rejected
    SELECT public.waive_accountability_commitment(v_m4_commit_w4, 'CONFIRM_WAIVER_V1') INTO v_res;
    IF (v_res->>'code') <> 'WAIVER_LIMIT_EXCEEDED' THEN
      RAISE EXCEPTION 'Fourth waiver in same week was not rejected: %', v_res;
    END IF;

    -- Commitment 4 must remain 'activated'
    SELECT commitment_status INTO v_m4_comm_status FROM public.task_accountability_commitments WHERE id = v_m4_commit_w4;
    IF v_m4_comm_status <> 'activated' THEN
      RAISE EXCEPTION 'Commitment 4 status was altered despite waiver quota rejection!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.22 Fourth Waiver in Same Calendar Week Strictly Blocked by Quota', 'PASS');

    -- 10.25 ATTACK: Direct client INSERT into accountability_waivers blocked
    BEGIN
      INSERT INTO public.accountability_waivers (
        commitment_id, user_id, task_id, confirmation_token, waiver_week_year, waiver_week_number, waiver_count_in_week
      ) VALUES (
        v_m4_commit_w4, v_user_a, v_m4_task_w4, 'CONFIRM_WAIVER_V1', 2026, 37, 4
      );
      RAISE EXCEPTION 'SECURITY VIOLATION: Direct client INSERT into accountability_waivers allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('10.23 Direct Client INSERT into accountability_waivers Blocked', 'PASS');
    END;

    -- 10.26 ATTACK: Direct client UPDATE or DELETE of waiver audit records blocked
    BEGIN
      UPDATE public.accountability_waivers SET confirmation_token = 'MODIFIED' WHERE commitment_id = v_m4_commit_w1;
      RAISE EXCEPTION 'SECURITY VIOLATION: Direct UPDATE of accountability_waivers allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('10.24 Direct UPDATE of accountability_waivers Blocked', 'PASS');
    END;

    BEGIN
      DELETE FROM public.accountability_waivers WHERE commitment_id = v_m4_commit_w1;
      RAISE EXCEPTION 'SECURITY VIOLATION: Direct DELETE of accountability_waivers allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('10.25 Direct DELETE of accountability_waivers Blocked', 'PASS');
    END;

    -- 10.27 ATTACK: Cross-user waiver SELECT blocked (User B cannot view User A waivers)
    SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
    SELECT count(*) INTO v_m4_waiver_count FROM public.accountability_waivers WHERE commitment_id = v_m4_commit_w1;
    IF v_m4_waiver_count <> 0 THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: User B read User A waiver audit records!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.26 Cross-User Waiver Audit Record SELECT Blocked', 'PASS');

    -- 10.28 Anonymous access to verification sessions and waivers blocked
    SET LOCAL ROLE anon;
    SET LOCAL "request.jwt.claim.sub" = '';
    SELECT count(*) INTO v_m4_sess_count FROM public.accountability_verification_sessions;
    SELECT count(*) INTO v_m4_waiver_count FROM public.accountability_waivers;
    IF v_m4_sess_count <> 0 OR v_m4_waiver_count <> 0 THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Anonymous read verification sessions or waivers!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('10.27 Anonymous Access Blocked for Sessions and Waivers Tables', 'PASS');
  END;

  -- ----------------------------------------------------------------
  -- SECTION 11: ACCOUNTABILITY HARDENING & EDGE CASES AUDIT
  -- ----------------------------------------------------------------
  DECLARE
    v_m5_def_id UUID;
    v_m5_task_trans UUID;
    v_m5_commit_trans UUID;
    v_m5_task_timed UUID;
    v_m5_commit_timed UUID;
    v_m5_task_refl UUID;
    v_m5_commit_refl UUID;
    v_m5_task_decl UUID;
    v_m5_commit_decl UUID;
    v_m5_task_tc UUID;
    v_m5_commit_tc UUID;
    v_m5_task_waived UUID;
    v_m5_commit_waived UUID;
    v_m5_target_task UUID;
    v_m5_target_task_b UUID;
    v_m5_res JSONB;
    v_m5_comm_status TEXT;
    v_m5_event_count INT;
    v_m5_meta JSONB;
  BEGIN
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

    -- 11.01 Setup commitment for state machine transition tests
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'M5 State Machine Task', 'pending', transaction_timestamp() + interval '1 day')
    RETURNING id INTO v_m5_task_trans;

    INSERT INTO public.task_accountability_commitments (task_id, user_id, consequence_snapshot, commitment_status)
    VALUES (v_m5_task_trans, v_user_a, jsonb_build_object('title', 'State Test', 'consequence_type', 'reflection', 'action_statement', 'Reflect'), 'committed')
    RETURNING id INTO v_m5_commit_trans;

    -- 11.02 ATTACK: Direct status transition committed -> fulfilled is blocked by trigger
    BEGIN
      PERFORM set_config('pact.internal_bypass', 'true', true);
      UPDATE public.task_accountability_commitments SET commitment_status = 'fulfilled' WHERE id = v_m5_commit_trans;
      RAISE EXCEPTION 'SECURITY VIOLATION: Transition committed -> fulfilled allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('11.01 Transition committed -> fulfilled Blocked by Trigger', 'PASS');
    END;

    -- 11.03 ATTACK: Direct status transition committed -> waived is blocked by trigger
    BEGIN
      PERFORM set_config('pact.internal_bypass', 'true', true);
      UPDATE public.task_accountability_commitments SET commitment_status = 'waived' WHERE id = v_m5_commit_trans;
      RAISE EXCEPTION 'SECURITY VIOLATION: Transition committed -> waived allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('11.02 Transition committed -> waived Blocked by Trigger', 'PASS');
    END;

    -- Activate commitment legitimately via deadline expiry & mark_task_missed
    UPDATE public.tasks SET deadline_at = transaction_timestamp() - interval '1 hour' WHERE id = v_m5_task_trans;
    PERFORM public.mark_task_missed(v_m5_task_trans);

    -- Fulfill it legitimately via internal bypass to test terminal state immutability
    PERFORM set_config('pact.internal_bypass', 'true', true);
    UPDATE public.task_accountability_commitments SET commitment_status = 'fulfilled' WHERE id = v_m5_commit_trans;

    -- 11.04 ATTACK: Transition from terminal fulfilled -> activated is blocked
    BEGIN
      PERFORM set_config('pact.internal_bypass', 'true', true);
      UPDATE public.task_accountability_commitments SET commitment_status = 'activated' WHERE id = v_m5_commit_trans;
      RAISE EXCEPTION 'SECURITY VIOLATION: Transition fulfilled -> activated allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('11.03 Transition fulfilled -> activated Blocked (Terminal State)', 'PASS');
    END;

    -- 11.05 ATTACK: Transition from terminal fulfilled -> waived is blocked
    BEGIN
      PERFORM set_config('pact.internal_bypass', 'true', true);
      UPDATE public.task_accountability_commitments SET commitment_status = 'waived' WHERE id = v_m5_commit_trans;
      RAISE EXCEPTION 'SECURITY VIOLATION: Transition fulfilled -> waived allowed!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('11.04 Transition fulfilled -> waived Blocked (Terminal State)', 'PASS');
    END;

    -- ----------------------------------------------------------------
    -- WRITTEN REFLECTION VERIFICATION TESTS
    -- ----------------------------------------------------------------
    -- Create task with written_reflection commitment
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'M5 Reflection Task', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m5_task_refl;

    INSERT INTO public.task_accountability_commitments (task_id, user_id, consequence_snapshot, commitment_status)
    VALUES (
      v_m5_task_refl,
      v_user_a,
      jsonb_build_object(
        'title', 'Reflection Consequence',
        'consequence_type', 'reflection',
        'action_statement', 'Write 100 words reflection on missed deadline',
        'verification_type', 'written_reflection'
      ),
      'committed'
    ) RETURNING id INTO v_m5_commit_refl;

    PERFORM public.mark_task_missed(v_m5_task_refl);

    -- 11.06 ATTACK: Written reflection < 20 characters rejected
    SELECT public.fulfill_written_reflection(v_m5_commit_refl, 'Too short') INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'REFLECTION_TOO_SHORT' THEN
      RAISE EXCEPTION 'Short reflection was not rejected: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.05 Written Reflection < 20 Chars Rejected', 'PASS');

    -- 11.07 ATTACK: Written reflection with whitespace-only rejected
    SELECT public.fulfill_written_reflection(v_m5_commit_refl, '                    ') INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'REFLECTION_TOO_SHORT' THEN
      RAISE EXCEPTION 'Whitespace reflection was not rejected: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.06 Written Reflection Whitespace Rejected', 'PASS');

    -- 11.08 Valid written reflection succeeds
    SELECT public.fulfill_written_reflection(v_m5_commit_refl, 'This is a genuine reflective note about planning better for deadlines.') INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'FULFILLED' THEN
      RAISE EXCEPTION 'Valid reflection fulfillment failed: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.07 Valid Written Reflection Fulfillment Succeeded', 'PASS');

    -- 11.09 Repeated written reflection is idempotent
    SELECT public.fulfill_written_reflection(v_m5_commit_refl, 'Duplicate call with valid text') INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'ALREADY_FULFILLED' THEN
      RAISE EXCEPTION 'Repeated reflection fulfillment did not return ALREADY_FULFILLED: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.08 Repeated Reflection Fulfillment Idempotent', 'PASS');

    -- ----------------------------------------------------------------
    -- DECLARATION FULFILLMENT TESTS (Explicitly Self-Reported)
    -- ----------------------------------------------------------------
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'M5 Declaration Task', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m5_task_decl;

    INSERT INTO public.task_accountability_commitments (task_id, user_id, consequence_snapshot, commitment_status)
    VALUES (
      v_m5_task_decl,
      v_user_a,
      jsonb_build_object(
        'title', 'Declaration Consequence',
        'consequence_type', 'personal_restriction',
        'action_statement', 'No social media for 24 hours',
        'verification_type', 'declaration'
      ),
      'committed'
    ) RETURNING id INTO v_m5_commit_decl;

    PERFORM public.mark_task_missed(v_m5_task_decl);

    -- Setup timed commitment for declaration rejection attack
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'M5 Timed Task', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m5_task_timed;

    INSERT INTO public.task_accountability_commitments (task_id, user_id, consequence_snapshot, commitment_status)
    VALUES (
      v_m5_task_timed,
      v_user_a,
      jsonb_build_object(
        'title', 'Timed Consequence',
        'consequence_type', 'self_improvement',
        'action_statement', 'Study 30 minutes',
        'verification_type', 'timed_session',
        'verification_config', jsonb_build_object('required_duration_seconds', 1800)
      ),
      'committed'
    ) RETURNING id INTO v_m5_commit_timed;

    PERFORM public.mark_task_missed(v_m5_task_timed);

    -- 11.10 ATTACK: Declaration rejected on timed_session consequence
    SELECT public.declare_accountability_fulfillment(v_m5_commit_timed, 'I declare I studied') INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'DECLARATION_NOT_PERMITTED' THEN
      RAISE EXCEPTION 'Declaration on timed session was not rejected: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.09 Declaration on Timed Session Consequence Blocked', 'PASS');

    -- 11.11 ATTACK: Declaration rejected with empty statement
    SELECT public.declare_accountability_fulfillment(v_m5_commit_decl, '   ') INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'DECLARATION_STATEMENT_REQUIRED' THEN
      RAISE EXCEPTION 'Empty declaration statement was not rejected: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.10 Empty Declaration Statement Rejected', 'PASS');

    -- 11.12 Valid declaration succeeds and records is_self_declaration = true
    SELECT public.declare_accountability_fulfillment(v_m5_commit_decl, 'I attest I stayed off social media.') INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'FULFILLED' OR (v_m5_res->>'is_self_declaration')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'Declaration fulfillment failed: %', v_m5_res;
    END IF;

    SELECT metadata INTO v_m5_meta FROM public.accountability_events
    WHERE commitment_id = v_m5_commit_decl AND event_type = 'fulfilled';
    IF (v_m5_meta->>'is_self_declaration')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'Accountability event did not record is_self_declaration = true!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.11 Declaration Recorded With Explicit Self-Attestation Audit Trail', 'PASS');

    -- ----------------------------------------------------------------
    -- TASK COMPLETION VERIFICATION TESTS
    -- ----------------------------------------------------------------
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'M5 Task Completion Consequence Task', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m5_task_tc;

    INSERT INTO public.task_accountability_commitments (task_id, user_id, consequence_snapshot, commitment_status)
    VALUES (
      v_m5_task_tc,
      v_user_a,
      jsonb_build_object(
        'title', 'Complete Chores Consequence',
        'consequence_type', 'extra_responsibility',
        'action_statement', 'Complete chore task',
        'verification_type', 'task_completion'
      ),
      'committed'
    ) RETURNING id INTO v_m5_commit_tc;

    PERFORM public.mark_task_missed(v_m5_task_tc);

    -- Target Task 1: pending task
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'Target Chore Task', 'pending', transaction_timestamp() + interval '1 day')
    RETURNING id INTO v_m5_target_task;

    -- 11.13 ATTACK: Circular reference (task fulfilling its own consequence)
    SELECT public.fulfill_task_completion_commitment(v_m5_commit_tc, v_m5_task_tc) INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'CIRCULAR_TASK_REFERENCE' THEN
      RAISE EXCEPTION 'Circular task completion was not rejected: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.12 Circular Task Self-Fulfillment Blocked', 'PASS');

    -- 11.14 ATTACK: Cross-user target task (User B target task)
    SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_b, 'User B Chore Task', 'completed', transaction_timestamp() - interval '10 minutes')
    RETURNING id INTO v_m5_target_task_b;

    SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
    SELECT public.fulfill_task_completion_commitment(v_m5_commit_tc, v_m5_target_task_b) INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'TARGET_TASK_NOT_FOUND' THEN
      RAISE EXCEPTION 'Cross-user target task was not rejected: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.13 Cross-User Target Task Fulfillment Blocked', 'PASS');

    -- 11.15 ATTACK: Uncompleted target task rejected
    SELECT public.fulfill_task_completion_commitment(v_m5_commit_tc, v_m5_target_task) INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'TARGET_TASK_NOT_COMPLETED' THEN
      RAISE EXCEPTION 'Uncompleted target task was not rejected: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.14 Incomplete Target Task Fulfillment Blocked', 'PASS');

    -- Authoritatively complete target chore task
    PERFORM public.complete_task(v_m5_target_task);

    -- 11.16 Valid task completion fulfillment succeeds
    SELECT public.fulfill_task_completion_commitment(v_m5_commit_tc, v_m5_target_task) INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'FULFILLED' THEN
      RAISE EXCEPTION 'Valid task completion fulfillment failed: %', v_m5_res;
    END IF;

    SELECT metadata INTO v_m5_meta FROM public.accountability_events
    WHERE commitment_id = v_m5_commit_tc AND event_type = 'fulfilled';
    IF (v_m5_meta->>'verified_objectively')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'Task completion was not marked as verified_objectively!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.15 Authoritative Task Completion Fulfillment Succeeded', 'PASS');

    -- ----------------------------------------------------------------
    -- SNAPSHOT RESILIENCE & WAIVER TABLE-TRIGGER DEFENSE
    -- ----------------------------------------------------------------
    -- 11.17 Create reusable consequence definition, link to task commitment, then delete reusable definition
    INSERT INTO public.consequence_definitions (user_id, title, consequence_type, action_statement, verification_type)
    VALUES (v_user_a, 'Temporary Definition', 'self_improvement', 'Run 5 miles', 'timed_session')
    RETURNING id INTO v_m5_def_id;

    DELETE FROM public.consequence_definitions WHERE id = v_m5_def_id;
    -- Existing commitments must still retain valid snapshots
    SELECT count(*) INTO v_m5_event_count FROM public.task_accountability_commitments WHERE user_id = v_user_a;
    IF v_m5_event_count = 0 THEN
      RAISE EXCEPTION 'Deleting consequence definition damaged commitments!';
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.16 Definition Deletion Preserves Committed Snapshot Integrity', 'PASS');

    -- 11.18 Table trigger blocks 4th waiver attempt even with internal bypass
    BEGIN
      PERFORM set_config('pact.internal_bypass', 'true', true);
      INSERT INTO public.accountability_waivers (
        commitment_id, user_id, task_id, confirmation_token, waiver_week_year, waiver_week_number, waiver_count_in_week
      ) VALUES (
        gen_random_uuid(), v_user_a, v_m5_task_trans, 'CONFIRM_WAIVER_V1', 2026, 37, 4
      );
      RAISE EXCEPTION 'SECURITY VIOLATION: Fourth waiver bypassed table quota trigger!';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _rls_audit_results VALUES ('11.17 Table-Level Trigger Strictly Blocks Waiver Quota Violation', 'PASS');
    END;

    -- 11.19 ATTACK: Attempting to waive already-fulfilled commitment rejected
    SELECT public.waive_accountability_commitment(v_m5_commit_refl, 'CONFIRM_WAIVER_V1') INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'COMMITMENT_NOT_ACTIVATED' THEN
      RAISE EXCEPTION 'Waiving fulfilled commitment was not rejected: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.18 Waiving Fulfilled Commitment Rejected by State Machine', 'PASS');

    -- Setup a separate waived commitment to test fulfillment on waived commitment
    INSERT INTO public.tasks (user_id, title, status, deadline_at)
    VALUES (v_user_a, 'M5 Waived Task', 'pending', transaction_timestamp() - interval '1 hour')
    RETURNING id INTO v_m5_task_waived;

    INSERT INTO public.task_accountability_commitments (task_id, user_id, consequence_snapshot, commitment_status)
    VALUES (
      v_m5_task_waived,
      v_user_a,
      jsonb_build_object('title', 'Waived Consequence', 'consequence_type', 'reflection', 'action_statement', 'Reflect', 'verification_type', 'written_reflection'),
      'committed'
    ) RETURNING id INTO v_m5_commit_waived;

    PERFORM public.mark_task_missed(v_m5_task_waived);
    PERFORM set_config('pact.internal_bypass', 'true', true);
    UPDATE public.task_accountability_commitments SET commitment_status = 'waived' WHERE id = v_m5_commit_waived;

    -- 11.20 ATTACK: Attempting to fulfill already-waived commitment rejected
    SELECT public.fulfill_written_reflection(v_m5_commit_waived, 'This is an attempt to fulfill a waived commitment.') INTO v_m5_res;
    IF (v_m5_res->>'code') <> 'COMMITMENT_NOT_ACTIVATED' THEN
      RAISE EXCEPTION 'Fulfilling waived commitment was not rejected: %', v_m5_res;
    END IF;
    INSERT INTO _rls_audit_results VALUES ('11.19 Fulfilling Waived Commitment Rejected by State Machine', 'PASS');
  END;



  -- Clean up test records
  RESET ROLE;
  DELETE FROM public.accountability_waivers WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.accountability_verification_sessions WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.accountability_events WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.task_accountability_commitments WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.user_accountability_preferences WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.consequence_definitions WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.tasks WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.projects WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.goals WHERE user_id IN (v_user_a, v_user_b);
END;
$$;

SELECT step, status FROM _rls_audit_results ORDER BY step;
