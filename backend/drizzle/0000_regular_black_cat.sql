CREATE TABLE "tables" (
	"id" text PRIMARY KEY NOT NULL,
	"table_number" text NOT NULL,
	"qr_slug" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"display_name" text,
	"capacity" integer DEFAULT 4,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tables_table_number_unique" UNIQUE("table_number"),
	CONSTRAINT "tables_qr_slug_unique" UNIQUE("qr_slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"icon" text,
	"badge" text
);
--> statement-breakpoint
CREATE TABLE "item_modifiers" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_item_id" text NOT NULL,
	"name" text NOT NULL,
	"price_extra" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"base_price" integer NOT NULL,
	"image_url" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_vegetarian" boolean DEFAULT false,
	"is_bestseller" boolean DEFAULT false,
	"is_chef_special" boolean DEFAULT false,
	"spicy_level" integer DEFAULT 0,
	"preparation_time" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"menu_item_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"selected_modifiers" jsonb DEFAULT '[]',
	"notes" text,
	"cart_item_id" text
);
--> statement-breakpoint
CREATE TABLE "order_status_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"status" text NOT NULL,
	"message" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"table_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_amount" integer NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"payment_method" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"table_number" text,
	"subtotal" integer,
	"service_charge" integer,
	"tax" integer,
	"notes" text,
	"estimated_minutes" integer DEFAULT 12
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"table_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"table_number" text,
	"reason" text,
	"payment_method" text,
	"split_count" integer,
	"custom_note" text
);
--> statement-breakpoint
ALTER TABLE "item_modifiers" ADD CONSTRAINT "item_modifiers_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tables_number" ON "tables" USING btree ("table_number");--> statement-breakpoint
CREATE INDEX "idx_tables_qr_slug" ON "tables" USING btree ("qr_slug");--> statement-breakpoint
CREATE INDEX "idx_tables_status" ON "tables" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_categories_sort" ON "categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_categories_active" ON "categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_item_modifiers_item" ON "item_modifiers" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "idx_menu_items_category" ON "menu_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_menu_items_available" ON "menu_items" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "idx_menu_items_sort" ON "menu_items" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_menu_item_id" ON "order_items" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "idx_order_logs_order" ON "order_status_logs" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_table_id" ON "orders" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_payment_status" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_orders_created_at" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_service_requests_table_id" ON "service_requests" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "idx_service_requests_status" ON "service_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_service_requests_created_at" ON "service_requests" USING btree ("created_at");