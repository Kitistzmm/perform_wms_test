import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ ปรับจำนวน Virtual Users และเพิ่ม Ramp-up Time
export const options = {
  stages: [
    { duration: "2m", target: 300 },
    { duration: "5m", target: 500 },
    { duration: "3m", target: 1000 },
    { duration: "2m", target: 1500 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<800"], // เพิ่มเงื่อนไขให้รองรับ Response Time สูงขึ้น
    "http_req_duration{status:200}": ["p(90)<600"],
    http_reqs: ["count>50000"], // ลดจำนวน Requests โดยรวม
  },
};

const BASE_URL = "http://203.154.184.162:5012/api/tooling/genPOToolingInquiry";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2NzM1MTAsImV4cCI6MTc0MDc1OTkxMH0.OSIfb6QOnRxADVUxVxnLU8rSfohcI_uwGie-SU6wsFA";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// ✅ 2️⃣ ใช้ Randomized Delay เพื่อลดความหนาแน่นของ Requests
function getRandomDelay(min, max) {
  return Math.random() * (max - min) + min;
}

// ✅ 3️⃣ สร้าง Payload แบบสุ่มเพื่อลดปัญหาการซ้ำกันของข้อมูล
function getDynamicPayload() {
  return JSON.stringify({
    user_id: "0fc9e975-8bfa-43ff-9f6f-c31120c9c957",
    oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
    company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
    dataForSave: [
      {
        ti_id: "03c4436a-ca7b-4e8a-9000-bb3d2e15224d",
        ti_amount: Math.floor(Math.random() * 500) + 1, // กำหนดจำนวนแบบสุ่ม
        ti_created_by: "0fc9e975-8bfa-43ff-9f6f-c31120c9c957",
        ti_created_date: new Date().toISOString(),
        ti_inquiry_id: "a9983cf3-c6e6-4f9d-a9b1-91a163002578",
        iq_inquiry_no: "IQ680115-02",
        ti_is_active: true,
        ti_is_use: true,
        tsup_supplier_id: "c73e03cb-3671-411a-9cb1-a75623c6133d",
        ts_name: "Yu test",
        tooling_code: null,
        tooling_id: null,
        tooling_name: null,
        tsup_id: "803cff7f-7eac-4c4b-9a69-3db50e39880b",
        is_select: true,
        duo_id: "803cff7f-7eac-4c4b-9a69-3db50e39880b",
        price: Math.floor(Math.random() * 5000) + 100, // ราคาสุ่มระหว่าง 100 - 5000
        buy_price: Math.floor(Math.random() * 5000) + 100,
      },
    ],
  });
}

// ✅ 4️⃣ ฟังก์ชันหลักในการรัน Load Test
export default function () {
  const payload = getDynamicPayload(); // ใช้ Payload ที่เปลี่ยนแปลงตลอดเวลา

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_TOKEN,
      "X-TTT-PMRP": X_TTT_PMRP,
    },
  };

  // 🔹 ส่งคำขอ POST
  const response = http.post(BASE_URL, payload, params);

  // 🔹 Log ข้อมูลเพื่อดูว่าแต่ละคำขอส่งอะไรไป
  console.log(
    `🔍 Sent Request with TI_ID: ${
      JSON.parse(payload).dataForSave[0].ti_id
    } | Status: ${response.status} | ⏳ Response Time: ${
      response.timings.duration
    } ms`
  );

  // 🔹 ตรวจสอบค่าที่ได้
  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 800ms": (r) => r.timings.duration < 800,
    "response is not empty": (r) => r.body && r.body.length > 0,
  });

  // ✅ 5️⃣ ใช้ `sleep()` เพื่อลดการยิง API ถี่เกินไป
  sleep(getRandomDelay(1, 5)); // หยุดพักระหว่าง 1 - 5 วินาที
}
