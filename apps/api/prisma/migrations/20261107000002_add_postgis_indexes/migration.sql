CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE INDEX IF NOT EXISTS "idx_venues_location_gist" ON "venues" USING GIST ("location");

ALTER TABLE "map_edges" ADD CONSTRAINT "chk_map_edges_step_free_not_stairs" CHECK (NOT (step_free = TRUE AND connection_type = 'STAIRS'));

ALTER TABLE "map_edges" ADD CONSTRAINT "chk_map_edges_distance_non_negative" CHECK (distance_meters >= 0);

ALTER TABLE "venues" ADD CONSTRAINT "chk_venues_latitude_range" CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE "venues" ADD CONSTRAINT "chk_venues_longitude_range" CHECK (longitude >= -180 AND longitude <= 180);

CREATE OR REPLACE FUNCTION check_elevator_different_floors()
RETURNS TRIGGER AS $$
DECLARE
    from_floor_id TEXT;
    to_floor_id TEXT;
BEGIN
    IF NEW.connection_type = 'ELEVATOR' THEN
        SELECT floor_id INTO from_floor_id FROM "map_nodes" WHERE id = NEW.from_node_id;
        SELECT floor_id INTO to_floor_id FROM "map_nodes" WHERE id = NEW.to_node_id;
        IF from_floor_id IS NOT NULL AND to_floor_id IS NOT NULL AND from_floor_id = to_floor_id THEN
            RAISE EXCEPTION 'ELEVATOR edge cannot connect nodes on the same floor';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_elevator_different_floors
BEFORE INSERT OR UPDATE ON "map_edges"
FOR EACH ROW
EXECUTE FUNCTION check_elevator_different_floors();
