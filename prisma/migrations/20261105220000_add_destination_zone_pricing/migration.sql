-- Tarification fondée uniquement sur la zone de destination.
CREATE TABLE "tarifs_destinations" (
  "id" SERIAL NOT NULL,
  "zone_id" INTEGER NOT NULL,
  "montant" DECIMAL(10,2) NOT NULL DEFAULT 1000,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "tarifs_destinations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tarifs_destinations_zone_id_key"
  ON "tarifs_destinations"("zone_id");

ALTER TABLE "tarifs_destinations"
  ADD CONSTRAINT "tarifs_destinations_zone_id_fkey"
  FOREIGN KEY ("zone_id") REFERENCES "zones"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "livraisons" ADD COLUMN "zone_destination_id" INTEGER;

CREATE INDEX "livraisons_zone_destination_id_idx"
  ON "livraisons"("zone_destination_id");

ALTER TABLE "livraisons"
  ADD CONSTRAINT "livraisons_zone_destination_id_fkey"
  FOREIGN KEY ("zone_destination_id") REFERENCES "zones"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
