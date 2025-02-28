import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ ตั้งค่า Virtual Users
export const options = {
  stages: [
    { duration: "5m", target: 1000 },
    { duration: "5m", target: 2000 },
    { duration: "2m", target: 500 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<800"],
    "http_req_duration{status:200}": ["p(90)<600"],
    http_reqs: ["count>50000"],
  },
};

// ✅ 2️⃣ ตั้งค่า API และ Headers
const BASE_URL =
  "http://203.154.184.162:5012/api/logProductFgEditAmount/genLotNo";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2NzM1MTAsImV4cCI6MTc0MDc1OTkxMH0.OSIfb6QOnRxADVUxVxnLU8rSfohcI_uwGie-SU6wsFA";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// ✅ 3️⃣ ใช้ Pagination เพื่อลดภาระของ API
const PAGE_SIZE = 100; // จำกัด API ให้ส่งคืนข้อมูลทีละ 100 รายการ

export default function () {
  const page = getRandomPage();
  const payload = getPayload(page);
  const params = getHeaders();

  // 🔹 ส่งคำขอ POST
  const response = http.post(BASE_URL, payload, params);

  // 🔹 ตรวจสอบผลลัพธ์ของ API
  validateResponse(response);

  // ✅ 4️⃣ ใช้ sleep() เพื่อลดความเร็วการยิง API
  sleep(getRandomDelay(3, 6)); // หยุดพักระหว่าง 3 - 6 วินาที
}

// 📌 ฟังก์ชัน: สร้าง Payload
function getPayload(page) {
  return JSON.stringify({
    oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
    company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
    page: page,
    size: PAGE_SIZE,
  });
}

// 📌 ฟังก์ชัน: ตั้งค่า Headers
function getHeaders() {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_TOKEN,
      "X-TTT-PMRP": X_TTT_PMRP,
    },
  };
}

// 📌 ฟังก์ชัน: ตรวจสอบผลลัพธ์ของ API
function validateResponse(response) {
  console.log(
    `🔍 Page: ${response.request.body} | Status: ${response.status} | ⏳ Response Time: ${response.timings.duration} ms`
  );

  check(response, {
    "✅ Status is 200": (r) => r.status === 200,
    "⏱ Response time < 800ms": (r) => r.timings.duration < 800,
    "📡 Response is not empty": (r) => r.body && r.body.length > 0,
  });
}

// 📌 ฟังก์ชัน: สุ่มเลือกหน้า
function getRandomPage() {
  return Math.floor(Math.random() * 5) + 1; // ดึงข้อมูลระหว่างหน้า 1 - 5
}

// 📌 ฟังก์ชัน: สุ่มเวลาหยุดพัก
function getRandomDelay(min, max) {
  return Math.random() * (max - min) + min;
}
