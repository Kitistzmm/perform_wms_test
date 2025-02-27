import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ ปรับจำนวน VUs และเพิ่ม Ramp-up ให้สมดุล
export const options = {
  stages: [
    { duration: "20s", target: 1000 }, // เริ่มจาก 50 VUs ใน 2 นาที
    // { duration: "5m", target: 200 }, // เพิ่มเป็น 200 VUs คงที่
    // { duration: "3m", target: 300 }, // สูงสุดที่ 300 VUs
    // { duration: "2m", target: 100 }, // ลดลงเหลือ 100 VUs
    // { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<800"], // ควบคุม Response Time
    "http_req_duration{status:200}": ["p(90)<600"],
    http_reqs: ["count<50000"], // จำกัดจำนวน Requests
  },
};

const BASE_URL = "http://203.154.184.162:5012/api/poInquiryDraft/create";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2NzM1MTAsImV4cCI6MTc0MDc1OTkxMH0.OSIfb6QOnRxADVUxVxnLU8rSfohcI_uwGie-SU6wsFA";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// ✅ 2️⃣ กำหนด LIMIT สำหรับจำนวนข้อมูลที่สร้าง
const MAX_ENTRIES = 5000; // จำกัดข้อมูลสูงสุดไม่ให้เกิน 5000 รายการ

// ✅ 3️⃣ สร้าง Payload แบบไดนามิก เพื่อลดข้อมูลซ้ำกัน
function getDynamicPayload() {
  return JSON.stringify({
    pid_inquiry_id: "aa530f67-3d90-4dca-b1f8-893369f25c1b",
    pid_tooling_id: "05e4cf20-6575-4d37-9981-798786e5d573",
    pid_amount: Math.floor(Math.random() * 100) + 1, // ปรับจำนวนให้อยู่ระหว่าง 1 - 100
    pid_price: Math.floor(Math.random() * 5000) + 100, // ราคาสุ่ม 100 - 5000
    pid_tooling_supplier_id: "c4f84496-b835-481a-9423-1bdfbc78ce7b",
    pid_is_select: Math.random() > 0.5, // สุ่มค่า true / false
    pid_po_id: "08cb9e55-e8cb-438a-8774-5fd646413d12",
    user_id: "0fc9e975-8bfa-43ff-9f6f-c31120c9c957",
    oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
    company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
  });
}

// ✅ 4️⃣ ฟังก์ชันหลักสำหรับ Load Test
export default function () {
  // 🔹 จำกัดจำนวนข้อมูลสูงสุด
  const currentCountResponse = http.get(`${BASE_URL}/count`, {
    headers: { Authorization: AUTH_TOKEN, "X-TTT-PMRP": X_TTT_PMRP },
  });

  const currentCount = JSON.parse(currentCountResponse.body).total || 0;

  if (currentCount >= MAX_ENTRIES) {
    console.log(
      `⚠️ Database เต็มแล้ว (${currentCount}/${MAX_ENTRIES}), ข้ามการสร้างข้อมูล`
    );
    sleep(5);
    return; // หยุดการสร้างข้อมูลถ้าเกิน LIMIT
  }

  const payload = getDynamicPayload();
  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_TOKEN,
      "X-TTT-PMRP": X_TTT_PMRP,
    },
  };

  // 🔹 ส่งคำขอ POST เพื่อสร้างข้อมูล
  const response = http.post(BASE_URL, payload, params);

  // 🔹 Log ข้อมูล
  console.log(
    `📦 Created PO_ID: ${JSON.parse(payload).pid_po_id} | Status: ${
      response.status
    } | ⏳ Response Time: ${response.timings.duration} ms`
  );

  // 🔹 ตรวจสอบค่าที่ได้
  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 800ms": (r) => r.timings.duration < 800,
    "response is not empty": (r) => r.body && r.body.length > 0,
  });

  // ✅ 5️⃣ ใช้ `sleep()` เพื่อลดความเร็วการยิง API
  sleep(Math.random() * (3 - 1) + 1); // หยุดพักระหว่าง 1 - 3 วินาที
}
