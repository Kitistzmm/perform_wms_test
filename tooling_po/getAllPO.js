import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ ปรับจำนวน Virtual Users ให้สมดุล
export const options = {
  stages: [
    { duration: "1m", target: 100 }, // ค่อย ๆ เพิ่ม VUs เป็น 100 ใน 1 นาที
    { duration: "3m", target: 200 }, // คงที่ที่ 200 VUs เป็นเวลา 3 นาที
    { duration: "1m", target: 50 }, // ลดลงเหลือ 50
    { duration: "30s", target: 0 }, // Ramp-down ค่อย ๆ ปิด
  ],
  thresholds: {
    http_req_duration: ["p(90)<800"], // เพิ่ม Threshold เป็น 800ms เพื่อให้รองรับโหลดได้
    "http_req_duration{status:200}": ["p(90)<600"],
    http_reqs: ["count>50000"], // ลดจำนวนคำขอที่ต้องการ
  },
};

const BASE_URL = "http://203.154.184.162:5012/api/purchaseOrder/getAll";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2MjQ0NzgsImV4cCI6MTc0MDcxMDg3OH0.ZiDS9D7p1q0gF0SK_dGGUKhhsa_2UEquRz0rpGIEd_g";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// ✅ 2️⃣ ใช้ Pagination เพื่อลดภาระของ API
const PAGE_SIZE = 100; // จำกัดให้ API ส่งคืนข้อมูลทีละ 100 รายการ

export default function () {
  const page = Math.floor(Math.random() * (9000 / PAGE_SIZE)) + 1; // ดึงข้อมูลแบบสุ่มหน้า
  const payload = JSON.stringify({
    oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
    company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
    page: page,
    size: PAGE_SIZE,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_TOKEN,
      "X-TTT-PMRP": X_TTT_PMRP,
    },
  };

  // 🔹 ส่งคำขอ POST เพื่อดึงข้อมูลแบบแบ่งหน้า
  const response = http.post(BASE_URL, payload, params);

  // 🔹 Log ข้อมูลแต่ละ Status
  console.log(
    `🔍 Page: ${page} | Status: ${response.status} | ⏳ Response Time: ${response.timings.duration} ms`
  );

  // 🔹 ตรวจสอบค่าที่ได้
  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 800ms": (r) => r.timings.duration < 800,
    "response is not empty": (r) => r.body && r.body.length > 0,
  });

  // ✅ 3️⃣ ใช้ sleep() เพื่อลดความเร็วการยิง API
  sleep(Math.random() * (5 - 2) + 2); // หยุดพักระหว่าง 2 - 5 วินาที
}
