
CREATE TABLE IF NOT EXISTS "site_contents" (
  "id" SERIAL PRIMARY KEY,
  "key" VARCHAR(100) NOT NULL UNIQUE,
  "section" VARCHAR(100) NOT NULL,
  "title" VARCHAR(255),
  "body" TEXT,
  "image_url" VARCHAR(1000),
  "button_label" VARCHAR(100),
  "button_url" VARCHAR(500),
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "site_contents_section_sort_order_idx"
ON "site_contents"("section", "sort_order");

INSERT INTO "site_contents"
("key", "section", "title", "body", "button_label", "button_url", "enabled", "sort_order", "updated_at")
VALUES
(
  'hero', 'hero',
  'Livrez partout à Abidjan en quelques clics.',
  'Envoyez vos colis rapidement grâce à notre réseau intelligent de coursiers et profitez d''un suivi en temps réel jusqu''à la livraison.',
  'Commander maintenant', '#commander', TRUE, 0, CURRENT_TIMESTAMP
),
(
  'features', 'features',
  'Pourquoi choisir Bimbim ?',
  'Une expérience de livraison pensée pour la vitesse, la confiance et le marché ivoirien.',
  NULL, NULL, TRUE, 1, CURRENT_TIMESTAMP
),
(
  'business', 'business',
  'Développez vos ventes avec Bimbim',
  'Offrez à vos clients une livraison fiable et rapide, et concentrez-vous sur la croissance de votre activité.',
  NULL, NULL, TRUE, 2, CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
