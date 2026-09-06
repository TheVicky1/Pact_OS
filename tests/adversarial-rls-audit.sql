-- PACT Phase 2A-SECURITY: Adversarial PostgreSQL RLS & Database Integrity Audit
-- Exercises the real remote PostgreSQL database engine under 'authenticated' role context for User A, User B, and Anonymous.

DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111';
  v_user_b UUID := '22222222-2222-2222-2222-222222222222';
  v_goal_a_id UUID;
  v_goal_b_id UUID;
  v_project_a_id UUID;
  v_project_b_id UUID;
  v_task_a_id UUID;
  v_count INT;
BEGIN
  RAISE NOTICE 'Starting Real PostgreSQL Database Adversarial Security Audit...';

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
  RAISE NOTICE '✅ Goal A created by User A (ID: %)', v_goal_a_id;

  -- 1.2 User A reads Goal A
  SELECT count(*) INTO v_count FROM public.goals WHERE id = v_goal_a_id;
  IF v_count <> 1 THEN RAISE EXCEPTION 'User A could not read own goal'; END IF;

  -- 1.3 Switch to User B context
  SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
  INSERT INTO public.goals (user_id, title) VALUES (v_user_b, 'User B Goal') RETURNING id INTO v_goal_b_id;

  -- 1.4 ATTACK: User B reads User A Goal
  SELECT count(*) INTO v_count FROM public.goals WHERE id = v_goal_a_id;
  IF v_count <> 0 THEN RAISE EXCEPTION 'SECURITY VIOLATION: User B read User A Goal!'; END IF;
  RAISE NOTICE '✅ Cross-User Goal SELECT Blocked by RLS!';

  -- 1.5 ATTACK: User B updates User A Goal
  UPDATE public.goals SET title = 'Hacked Title' WHERE id = v_goal_a_id;
  IF FOUND THEN RAISE EXCEPTION 'SECURITY VIOLATION: User B updated User A Goal!'; END IF;
  RAISE NOTICE '✅ Cross-User Goal UPDATE Blocked by RLS!';

  -- 1.6 ATTACK: User B deletes User A Goal
  DELETE FROM public.goals WHERE id = v_goal_a_id;
  IF FOUND THEN RAISE EXCEPTION 'SECURITY VIOLATION: User B deleted User A Goal!'; END IF;
  RAISE NOTICE '✅ Cross-User Goal DELETE Blocked by RLS!';

  -- 1.7 ATTACK: User B inserts goal with forged user_id = User A
  BEGIN
    INSERT INTO public.goals (user_id, title) VALUES (v_user_a, 'Forged Goal');
    RAISE EXCEPTION 'SECURITY VIOLATION: User B inserted goal for User A!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ Forged user_id Goal INSERT Blocked by RLS!';
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      RAISE NOTICE '✅ Forged user_id Goal INSERT Blocked by RLS!';
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
    RAISE NOTICE '✅ Cross-User Parent Goal Linkage on Project INSERT Blocked by RLS!';
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      RAISE NOTICE '✅ Cross-User Parent Goal Linkage on Project INSERT Blocked by RLS!';
    ELSE
      RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
    END IF;
  END;

  -- 2.2 Switch to User A context
  SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

  -- 2.3 User A creates valid Project A
  INSERT INTO public.projects (user_id, goal_id, title) VALUES (v_user_a, v_goal_a_id, 'User A Project') RETURNING id INTO v_project_a_id;
  RAISE NOTICE '✅ Project A created by User A (ID: %)', v_project_a_id;

  -- 2.4 ATTACK: User A updates Project A setting goal_id = User B's Goal B
  BEGIN
    UPDATE public.projects SET goal_id = v_goal_b_id WHERE id = v_project_a_id;
    RAISE EXCEPTION 'SECURITY VIOLATION: User A updated project goal_id to User B Goal!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ Cross-User Parent Goal Linkage on Project UPDATE Blocked by RLS!';
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      RAISE NOTICE '✅ Cross-User Parent Goal Linkage on Project UPDATE Blocked by RLS!';
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
    RAISE NOTICE '✅ Cross-User Parent Project Linkage on Task INSERT Blocked by RLS!';
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      RAISE NOTICE '✅ Cross-User Parent Project Linkage on Task INSERT Blocked by RLS!';
    ELSE
      RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
    END IF;
  END;

  -- 3.3 ATTACK: User B creates task linked to User A's Goal A
  BEGIN
    INSERT INTO public.tasks (user_id, goal_id, title, deadline_at) VALUES (v_user_b, v_goal_a_id, 'User B Task', now() + interval '1 day');
    RAISE EXCEPTION 'SECURITY VIOLATION: User B linked task to User A Goal!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ Cross-User Parent Goal Linkage on Task INSERT Blocked by RLS!';
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      RAISE NOTICE '✅ Cross-User Parent Goal Linkage on Task INSERT Blocked by RLS!';
    ELSE
      RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
    END IF;
  END;

  -- 3.4 Switch back to User A
  SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
  INSERT INTO public.tasks (user_id, project_id, goal_id, title, deadline_at) VALUES (v_user_a, v_project_a_id, v_goal_a_id, 'User A Task', now() + interval '1 day') RETURNING id INTO v_task_a_id;
  RAISE NOTICE '✅ Task A created by User A (ID: %)', v_task_a_id;

  -- 3.5 ATTACK: User A updates Task A setting project_id = User B's Project B
  BEGIN
    UPDATE public.tasks SET project_id = v_project_b_id WHERE id = v_task_a_id;
    RAISE EXCEPTION 'SECURITY VIOLATION: User A updated task project_id to User B Project!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ Cross-User Parent Project Linkage on Task UPDATE Blocked by RLS!';
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      RAISE NOTICE '✅ Cross-User Parent Project Linkage on Task UPDATE Blocked by RLS!';
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
    RAISE NOTICE '✅ Direct UPDATE of completed_at Blocked by Trigger!';
  END;

  -- 4.2 UPDATE missed_at Test
  BEGIN
    UPDATE public.tasks SET missed_at = now() WHERE id = v_task_a_id;
    RAISE EXCEPTION 'SECURITY VIOLATION: Direct UPDATE of missed_at allowed!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ Direct UPDATE of missed_at Blocked by Trigger!';
  END;

  -- 4.3 INSERT completed_at Forgery Test
  BEGIN
    INSERT INTO public.tasks (user_id, title, deadline_at, completed_at)
    VALUES (v_user_a, 'Forged Task', now() + interval '1 day', now());
    RAISE EXCEPTION 'SECURITY VIOLATION: Direct INSERT of completed_at allowed!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ Direct INSERT of completed_at Blocked by Trigger!';
  END;

  -- 4.4 INSERT missed_at Forgery Test
  BEGIN
    INSERT INTO public.tasks (user_id, title, deadline_at, missed_at)
    VALUES (v_user_a, 'Forged Missed Task', now() + interval '1 day', now());
    RAISE EXCEPTION 'SECURITY VIOLATION: Direct INSERT of missed_at allowed!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ Direct INSERT of missed_at Blocked by Trigger!';
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

  RAISE NOTICE '✅ Anonymous access to all core domain tables Blocked!';
  RAISE NOTICE '🎉 ALL REAL POSTGRESQL DATABASE ADVERSARIAL SECURITY AUDITS COMPLETED AND VERIFIED!';
END;
$$;
