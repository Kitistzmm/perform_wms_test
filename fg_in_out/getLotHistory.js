import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ ตั้งค่า Virtual Users และ Ramp-up
export const options = {
  stages: [
    { duration: "3m", target: 500 },
    { duration: "5m", target: 1000 },
    { duration: "3m", target: 500 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<800"], // จำกัด Response Time ใน 800ms
    "http_req_duration{status:200}": ["p(90)<600"],
    http_reqs: ["count<50000"], // จำกัดจำนวน Requests รวม
  },
};

// ✅ 2️⃣ ตั้งค่า API และ Headers
const BASE_URL =
  "http://203.154.184.162:5012/api/logProductFgEditAmount/getLotHistory";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2NzM1MTAsImV4cCI6MTc0MDc1OTkxMH0.OSIfb6QOnRxADVUxVxnLU8rSfohcI_uwGie-SU6wsFA";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// ✅ 3️⃣ ฟังก์ชันหลัก
export default function () {
  const payload = getDynamicPayload();
  const params = getHeaders();

  // 🔹 ส่งคำขอ POST
  const response = http.post(BASE_URL, payload, params);

  // 🔹 ตรวจสอบผลลัพธ์ของ API
  validateResponse(response);

  // ✅ 4️⃣ ใช้ sleep() เพื่อลดความเร็วการยิง API
  sleep(getRandomDelay(6, 12)); // หยุดพักระหว่าง 6 - 12 วินาที
}

// 📌 ฟังก์ชัน: สร้าง Payload แบบ Dynamic
function getDynamicPayload() {
  return JSON.stringify({
    product_id: getRandomProductId(),
    page: getRandomPage(),
    size: getRandomSize(),
    oem_id: "ad5431b1-4136-4695-a1c2-7fe02b137d68",
    company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
  });
}

// 📌 ฟังก์ชัน: ตั้งค่า Headers
function getHeaders() {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_TOKEN,
      "X-TTT-PMRP": X_TTT_PMRP,
      "Cache-Control": "no-cache", // ลดการใช้ Cache ของเซิร์ฟเวอร์
    },
  };
}

// 📌 ฟังก์ชัน: ตรวจสอบผลลัพธ์ของ API
function validateResponse(response) {
  console.log(
    `📦 Sent Payload | Status: ${response.status} | ⏳ Response Time: ${response.timings.duration} ms`
  );

  check(response, {
    "✅ Status is 200": (r) => r.status === 200,
    "⏱ Response time < 800ms": (r) => r.timings.duration < 800,
    "📡 Response is not empty": (r) => r.body && r.body.length > 0,
  });
}

// 📌 ฟังก์ชัน: สุ่มเลือก `product_id`
function getRandomProductId() {
  const productIds = [
    "01356618-f3a6-4f50-8a4f-4cc720b12c2a",
    "05815c6e-253d-4de8-bd8d-ee338ccff162",
    "099eeeb0-8a7c-4ad7-a0d0-8255574427e2",
    "10c95968-cf68-45a5-b3dc-20c4decb16e7",
  ];
  return productIds[Math.floor(Math.random() * productIds.length)];
}

// 📌 ฟังก์ชัน: สุ่มเลือกหน้า
function getRandomPage() {
  return Math.floor(Math.random() * 5) + 1; // ดึงข้อมูลระหว่างหน้า 1 - 5
}

// 📌 ฟังก์ชัน: สุ่มขนาดข้อมูลที่ต้องการ (`size`)
function getRandomSize() {
  return [10, 20, 50][Math.floor(Math.random() * 3)]; // เลือก `size` เป็น 10, 20 หรือ 50
}

// 📌 ฟังก์ชัน: สุ่มเวลาหยุดพัก
function getRandomDelay(min, max) {
  return Math.random() * (max - min) + min;
}
