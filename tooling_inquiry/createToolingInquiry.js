import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ ตั้งค่า Virtual Users และ Ramp-up
export const options = {
  stages: [
    { duration: "30s", target: 100 }, // ค่อย ๆ เพิ่ม VUs เป็น 100
    { duration: "2m", target: 300 }, // ค่อย ๆ เพิ่มเป็น 300 VUs
    { duration: "3m", target: 500 }, // Peak Load 500 VUs
    { duration: "1m", target: 100 }, // ลดลงเหลือ 100
    { duration: "30s", target: 0 }, // Ramp-down ปิดการทดสอบ
  ],
  thresholds: {
    http_req_duration: ["p(90)<500"], // จำกัด Response Time ใน 500ms
    "http_req_duration{status:200}": ["p(90)<400"],
    http_reqs: ["count>100000"], // ต้องส่ง Request มากกว่า 100,000 ครั้ง
  },
};

// ✅ 2️⃣ ตั้งค่า API และ Headers
const BASE_URL = "http://203.154.184.162:5012/api/toolingInquiry/create";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2NzM1MTAsImV4cCI6MTc0MDc1OTkxMH0.OSIfb6QOnRxADVUxVxnLU8rSfohcI_uwGie-SU6wsFA";
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
  const uniqueInquiryName = `IQ_${Date.now()}_${__VU}_${__ITER}`; // ใช้ Timestamp + VU ID + Iteration ID ให้ไม่ซ้ำกัน

  const dynamicPayload = JSON.stringify({
    ti_inquiry_name: uniqueInquiryName, // ✅ ใช้ค่าไม่ซ้ำกัน
    ti_tooling_id: "05e4cf20-6575-4d37-9981-798786e5d573",
    ti_amount: "100",
    ti_created_by: "0fc9e975-8bfa-43ff-9f6f-c31120c9c957",
    ti_updated_by: "0fc9e975-8bfa-43ff-9f6f-c31120c9c957",
    ti_company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
    ti_oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
    iq_remark: "TEST",
  });

  // 🔹 ส่งคำขอ POST
  const response = http.post(BASE_URL, dynamicPayload, params);

  // 🔹 Log ข้อมูลเพื่อเช็คค่า `ti_inquiry_name`
  console.log(
    `📦 Sent Inquiry: ${uniqueInquiryName} | Status: ${response.status} | ⏳ Response Time: ${response.timings.duration} ms`
  );

  // 🔹 ตรวจสอบค่าที่ได้
  check(response, {
    "✅ Status is 200": (r) => r.status === 200,
    "⏱ Response time < 500ms": (r) => r.timings.duration < 500,
    "📡 Response is not empty": (r) => r.body && r.body.length > 0,
  });

  sleep(1);
}
