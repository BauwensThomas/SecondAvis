


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."refund_expired_request"("p_request_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_status TEXT;
  v_payment_intent TEXT;
BEGIN
  SELECT status, stripe_payment_intent_id
  INTO v_status, v_payment_intent
  FROM requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_status != 'pending' THEN
    RETURN 'skipped';
  END IF;

  UPDATE requests SET status = 'refunded' WHERE id = p_request_id;

  RETURN v_payment_intent;
END;
$$;


ALTER FUNCTION "public"."refund_expired_request"("p_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_type" "text" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "recipient_email" "text" NOT NULL,
    "related_type" "text",
    "related_id" "uuid",
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "expert_id" "uuid",
    "content" "text" NOT NULL,
    "verdict" "text",
    "delivered_at" timestamp with time zone,
    "contest_window_ends" timestamp with time zone,
    "payment_eligible_at" timestamp with time zone,
    "is_contested" boolean DEFAULT false,
    "contest_reason" "text",
    "contest_resolved" boolean DEFAULT false,
    "contest_decision" "text",
    "admin_decision_at" timestamp with time zone,
    "is_paid" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "old_value" "jsonb",
    "new_value" "jsonb",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "expert_id" "uuid",
    "consent_type" "text" NOT NULL,
    "version" "text" NOT NULL,
    "accepted" boolean NOT NULL,
    "ip_address" "text",
    "accepted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expert_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "bio" "text",
    "categories" "text"[] NOT NULL,
    "years_experience" integer NOT NULL,
    "city" "text" NOT NULL,
    "languages" "text"[] DEFAULT '{fr}'::"text"[],
    "entity_type" "text" NOT NULL,
    "company_name" "text",
    "bce_number" "text",
    "vat_number" "text",
    "motivation" "text",
    "document_url" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."expert_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expert_charters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expert_id" "uuid",
    "charter_version" "text" NOT NULL,
    "signed_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "text",
    "pdf_url" "text",
    "signature_data" "text",
    "expert_full_name" "text",
    "expert_email" "text"
);


ALTER TABLE "public"."expert_charters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."experts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "display_name" "text" NOT NULL,
    "photo_url" "text",
    "bio" "text",
    "categories" "text"[] NOT NULL,
    "years_experience" integer NOT NULL,
    "city" "text" NOT NULL,
    "languages" "text"[] DEFAULT '{fr}'::"text"[],
    "availabilities" "text",
    "website_url" "text",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "address_street" "text" NOT NULL,
    "address_zip" "text" NOT NULL,
    "address_city" "text" NOT NULL,
    "address_country" "text" DEFAULT 'BE'::"text",
    "entity_type" "text" NOT NULL,
    "company_name" "text",
    "bce_number" "text",
    "vat_number" "text",
    "justification_url" "text",
    "is_verified" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "is_blocked" boolean DEFAULT false,
    "suspension_reason" "text",
    "suspension_type" "text",
    "suspended_at" timestamp with time zone,
    "average_rating" numeric DEFAULT 0,
    "total_answers" integer DEFAULT 0,
    "total_signals" integer DEFAULT 0,
    "response_rate" numeric DEFAULT 100,
    "stripe_account_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "phone_public" boolean DEFAULT false,
    "address_public" boolean DEFAULT false
);


ALTER TABLE "public"."experts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gdpr_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_type" "text" NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "requester_email" "text" NOT NULL,
    "request_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone
);


ALTER TABLE "public"."gdpr_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."login_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "ip_address" "text",
    "success" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."login_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expert_id" "uuid",
    "amount_cents" integer NOT NULL,
    "stripe_transfer_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "answer_id" "uuid"
);


ALTER TABLE "public"."payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "answer_id" "uuid",
    "user_id" "uuid",
    "expert_id" "uuid",
    "score" integer,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "closed" boolean DEFAULT false,
    CONSTRAINT "ratings_score_check" CHECK ((("score" >= 1) AND ("score" <= 5)))
);


ALTER TABLE "public"."ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "category" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "attachments" "text"[],
    "status" "text" DEFAULT 'pending'::"text",
    "amount_cents" integer DEFAULT 900,
    "stripe_payment_intent_id" "text",
    "receipt_number" "text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "payment_confirmed" boolean DEFAULT false,
    "locked_by" "uuid",
    "locked_at" timestamp with time zone,
    "refund_reason" "text"
);


ALTER TABLE "public"."requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suspension_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expert_id" "uuid",
    "action" "text" NOT NULL,
    "type" "text",
    "reason" "text",
    "related_answer_id" "uuid",
    "related_signalement_id" "uuid",
    "contest_decision" "text",
    "created_by" "text" DEFAULT 'admin'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."suspension_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "phone" "text",
    "is_adult_confirmed" boolean DEFAULT false,
    "marketing_emails" boolean DEFAULT false,
    "is_blocked" boolean DEFAULT false,
    "stripe_customer_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "registration_ip" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_emails"
    ADD CONSTRAINT "admin_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consents"
    ADD CONSTRAINT "consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expert_applications"
    ADD CONSTRAINT "expert_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expert_charters"
    ADD CONSTRAINT "expert_charters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."experts"
    ADD CONSTRAINT "experts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gdpr_requests"
    ADD CONSTRAINT "gdpr_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."login_attempts"
    ADD CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suspension_logs"
    ADD CONSTRAINT "suspension_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_answers_expert_id" ON "public"."answers" USING "btree" ("expert_id");



CREATE INDEX "idx_answers_request_id" ON "public"."answers" USING "btree" ("request_id");



CREATE INDEX "idx_experts_email" ON "public"."experts" USING "btree" ("email");



CREATE INDEX "idx_experts_phone" ON "public"."experts" USING "btree" ("phone");



CREATE INDEX "idx_login_attempts" ON "public"."login_attempts" USING "btree" ("email", "created_at");



CREATE INDEX "idx_requests_status" ON "public"."requests" USING "btree" ("status");



CREATE INDEX "idx_requests_user_id" ON "public"."requests" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_phone" ON "public"."users" USING "btree" ("phone");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id");



ALTER TABLE ONLY "public"."expert_applications"
    ADD CONSTRAINT "expert_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."expert_charters"
    ADD CONSTRAINT "expert_charters_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id");



ALTER TABLE ONLY "public"."experts"
    ADD CONSTRAINT "experts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "public"."answers"("id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "public"."experts"("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."suspension_logs"
    ADD CONSTRAINT "suspension_logs_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id");



ALTER TABLE ONLY "public"."suspension_logs"
    ADD CONSTRAINT "suspension_logs_related_answer_id_fkey" FOREIGN KEY ("related_answer_id") REFERENCES "public"."answers"("id");



ALTER TABLE ONLY "public"."suspension_logs"
    ADD CONSTRAINT "suspension_logs_related_signalement_id_fkey" FOREIGN KEY ("related_signalement_id") REFERENCES "public"."answers"("id");



ALTER TABLE "public"."admin_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."answers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "answers_insert_expert" ON "public"."answers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."experts"
  WHERE (("experts"."id" = "answers"."expert_id") AND ("experts"."user_id" = "auth"."uid"())))));



CREATE POLICY "answers_select_client" ON "public"."answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."requests"
  WHERE (("requests"."id" = "answers"."request_id") AND ("requests"."user_id" = "auth"."uid"())))));



CREATE POLICY "answers_select_expert" ON "public"."answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."experts"
  WHERE (("experts"."id" = "answers"."expert_id") AND ("experts"."user_id" = "auth"."uid"())))));



CREATE POLICY "applications_insert_own" ON "public"."expert_applications" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "charters_select_own" ON "public"."expert_charters" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."experts"
  WHERE (("experts"."id" = "expert_charters"."expert_id") AND ("experts"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."consents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "consents_select_own" ON "public"."consents" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."experts"
  WHERE (("experts"."id" = "consents"."expert_id") AND ("experts"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."expert_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expert_charters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."experts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "experts_select_own" ON "public"."experts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "experts_select_public" ON "public"."experts" FOR SELECT USING ((("is_verified" = true) AND ("is_active" = true)));



CREATE POLICY "experts_update_own" ON "public"."experts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "gdpr_insert_own" ON "public"."gdpr_requests" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."gdpr_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gdpr_select_own" ON "public"."gdpr_requests" FOR SELECT USING (((("requester_type" = 'user'::"text") AND ("auth"."uid"() = "requester_id")) OR (("requester_type" = 'expert'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."experts"
  WHERE (("experts"."id" = "gdpr_requests"."requester_id") AND ("experts"."user_id" = "auth"."uid"())))))));



ALTER TABLE "public"."login_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payouts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payouts_select_own" ON "public"."payouts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."experts"
  WHERE (("experts"."id" = "payouts"."expert_id") AND ("experts"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."ratings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ratings_insert_own" ON "public"."ratings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "ratings_select_all" ON "public"."ratings" FOR SELECT USING (true);



ALTER TABLE "public"."requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "requests_insert_own" ON "public"."requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "requests_select_own" ON "public"."requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."suspension_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_insert_own" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users_select_own" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."refund_expired_request"("p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."refund_expired_request"("p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refund_expired_request"("p_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_emails" TO "anon";
GRANT ALL ON TABLE "public"."admin_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_emails" TO "service_role";



GRANT ALL ON TABLE "public"."answers" TO "anon";
GRANT ALL ON TABLE "public"."answers" TO "authenticated";
GRANT ALL ON TABLE "public"."answers" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."consents" TO "anon";
GRANT ALL ON TABLE "public"."consents" TO "authenticated";
GRANT ALL ON TABLE "public"."consents" TO "service_role";



GRANT ALL ON TABLE "public"."expert_applications" TO "anon";
GRANT ALL ON TABLE "public"."expert_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_applications" TO "service_role";



GRANT ALL ON TABLE "public"."expert_charters" TO "anon";
GRANT ALL ON TABLE "public"."expert_charters" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_charters" TO "service_role";



GRANT ALL ON TABLE "public"."experts" TO "anon";
GRANT ALL ON TABLE "public"."experts" TO "authenticated";
GRANT ALL ON TABLE "public"."experts" TO "service_role";



GRANT ALL ON TABLE "public"."gdpr_requests" TO "anon";
GRANT ALL ON TABLE "public"."gdpr_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."gdpr_requests" TO "service_role";



GRANT ALL ON TABLE "public"."login_attempts" TO "anon";
GRANT ALL ON TABLE "public"."login_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."login_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."payouts" TO "anon";
GRANT ALL ON TABLE "public"."payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."payouts" TO "service_role";



GRANT ALL ON TABLE "public"."ratings" TO "anon";
GRANT ALL ON TABLE "public"."ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."ratings" TO "service_role";



GRANT ALL ON TABLE "public"."requests" TO "anon";
GRANT ALL ON TABLE "public"."requests" TO "authenticated";
GRANT ALL ON TABLE "public"."requests" TO "service_role";



GRANT ALL ON TABLE "public"."suspension_logs" TO "anon";
GRANT ALL ON TABLE "public"."suspension_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."suspension_logs" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































