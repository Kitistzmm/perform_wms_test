import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "3m", target: 300 },
    { duration: "3m", target: 600 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<500"],
    "http_req_duration{status:200}": ["p(90)<400"],
    http_reqs: ["count>100000"],
  },
};

const BASE_URL = "http://203.154.184.162:5012/api/purchaseOrder/create";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2MjQ0NzgsImV4cCI6MTc0MDcxMDg3OH0.ZiDS9D7p1q0gF0SK_dGGUKhhsa_2UEquRz0rpGIEd_g";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// 🔹 Headers ที่ใช้
const params = {
  headers: {
    "Content-Type": "application/json",
    Authorization: AUTH_TOKEN,
    "X-TTT-PMRP": X_TTT_PMRP,
  },
};

export default function () {
  const uniquePoNo = `PO_DREAMie_${__VU}_${__ITER}`; // ใช้ VU ID และ Iteration ID

  const dynamicPayload = JSON.stringify({
    user_id: "0fc9e975-8bfa-43ff-9f6f-c31120c9c957",
    oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
    company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
    supplierList: [
      {
        po_no: uniquePoNo, // ใช้ค่า `po_no` ที่ไม่ซ้ำกัน
        toolingList: [
          {
            pi_inquiry_id: "a9983cf3-c6e6-4f9d-a9b1-91a163002578",
            pi_tooling_id: "4f2c807c-fdf9-4a9d-ab16-7059a75b93cb",
            pi_amount: "1",
            pi_price: "1",
            supplier_id: "c73e03cb-3671-411a-9cb1-a75623c6133d",
          },
        ],
      },
    ],
  });

  // 🔹 ส่งคำขอ POST
  const response = http.post(BASE_URL, dynamicPayload, params);

  // 🔹 Log ข้อมูลเพื่อเช็คค่า po_no
  console.log(
    `🔍 Sent PO_NO: ${uniquePoNo} | Status: ${response.status} | ⏳ Response Time: ${response.timings.duration} ms`
  );

  // 🔹 ตรวจสอบค่าที่ได้
  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "response is not empty": (r) => r.body && r.body.length > 0,
  });

  sleep(1);
}
