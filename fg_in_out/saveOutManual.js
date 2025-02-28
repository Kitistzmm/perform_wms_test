import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ ตั้งค่า Virtual Users และ Ramp-up
export const options = {
  stages: [
    { duration: "3m", target: 500 }, // เริ่มต้นที่ 500 VUs
    { duration: "5m", target: 1000 }, // ค่อย ๆ เพิ่มเป็น 1000 VUs
    { duration: "3m", target: 500 }, // ค่อย ๆ ลดลงเหลือ 500 VUs
    { duration: "1m", target: 100 }, // ลดลงเหลือ 100 VUs
    { duration: "30s", target: 0 }, // ค่อย ๆ ปิด Load Test
  ],
  thresholds: {
    http_req_duration: ["p(90)<800"], // จำกัด Response Time ใน 800ms
    "http_req_duration{status:200}": ["p(90)<600"],
    http_reqs: ["count<50000"], // จำกัดจำนวน Requests
  },
};

// ✅ 2️⃣ ตั้งค่า API และ Headers
const BASE_URL =
  "http://203.154.184.162:5012/api/logProductFgEditAmount/SaveLotOutManual";
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
  sleep(getRandomDelay(4, 8)); // หยุดพักระหว่าง 4 - 8 วินาที
}

// 📌 ฟังก์ชัน: สร้าง Payload แบบ Dynamic
function getDynamicPayload() {
  return JSON.stringify({
    id: "f0920638-0a1c-4ef7-929a-df7678054bb8",
    edit_type: false,
    lot_no: "20250204-0001",
    lot_no_select: "20250204-0001", // lot ที่จะ out
    amount: 2,
    project_id: "96d8450c-472a-4e7a-884d-7a150f9c49d6",
    remark: "dream out manual 5",
    color: null,
    sell_price: 0,
    buy_price: "",
    is_trade: false,
    lot_type: null,
    user_id: "0fc9e975-8bfa-43ff-9f6f-c31120c9c957",
    oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
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

// 📌 ฟังก์ชัน: สุ่มเวลาหยุดพัก
function getRandomDelay(min, max) {
  return Math.random() * (max - min) + min;
}
