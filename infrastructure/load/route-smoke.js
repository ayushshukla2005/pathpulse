import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  vus: 50,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

const BASE_URL = __ENV.API_URL || "http://localhost:4000/api/v1";
const TOKEN = __ENV.AUTH_TOKEN || "";
const BUILDING_ID = __ENV.BUILDING_ID || "00000000-0000-0000-0000-000000000001";
const ORIGIN_NODE_ID = __ENV.ORIGIN_NODE_ID || "00000000-0000-0000-0000-000000000002";
const DEST_NODE_ID = __ENV.DEST_NODE_ID || "00000000-0000-0000-0000-000000000003";

export default function () {
  const payload = JSON.stringify({
    buildingId: BUILDING_ID,
    originNodeId: ORIGIN_NODE_ID,
    destinationNodeId: DEST_NODE_ID,
    profile: "WHEELCHAIR",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
  };

  const res = http.post(`${BASE_URL}/routes`, payload, params);

  check(res, {
    "status is 200 or 422": (r) => r.status === 200 || r.status === 422,
  });

  sleep(0.1);
}
