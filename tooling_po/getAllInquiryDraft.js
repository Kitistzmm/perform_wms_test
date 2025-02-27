import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ ปรับจำนวน Virtual Users และเพิ่ม Ramp-up ให้สมดุล
export const options = {
  stages: [
    { duration: "2m", target: 500 }, // ค่อย ๆ เพิ่ม VUs เป็น 500 ใน 2 นาที
    { duration: "5m", target: 1000 }, // คงที่ที่ 1000 VUs เป็นเวลา 5 นาที
    { duration: "3m", target: 1500 }, // เพิ่มเป็น 1500 VUs
    { duration: "2m", target: 2000 }, // สูงสุดที่ 2000 VUs
    { duration: "3m", target: 500 }, // ลดลงเหลือ 500 VUs
    { duration: "1m", target: 0 }, // ค่อย ๆ ปิด Load Test
  ],
  thresholds: {
    http_req_duration: ["p(90)<1000"], // เพิ่ม Threshold เป็น 1000ms เพื่อให้รองรับโหลดได้
    "http_req_duration{status:200}": ["p(90)<800"],
    http_reqs: ["count<100000"], // จำกัดจำนวน Requests ต่อ Run
  },
};

const BASE_URL = "http://203.154.184.162:5012/api/poInquiryDraft/getAll";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2NzM1MTAsImV4cCI6MTc0MDc1OTkxMH0.OSIfb6QOnRxADVUxVxnLU8rSfohcI_uwGie-SU6wsFA";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// ✅ 2️⃣ ใช้ Pagination เพื่อลดภาระของ API
const PAGE_SIZE = 100; // จำกัดให้ API ส่งคืนข้อมูลทีละ 100 รายการ

// ✅ 3️⃣ ฟังก์ชันช่วยเหลือ: เลือกหน้าแบบสุ่ม และกำหนด Delay
function getRandomPage() {
  return Math.floor(Math.random() * (9000 / PAGE_SIZE)) + 1; // เลือกหน้าสุ่ม
}

function getRandomDelay(min, max) {
  return Math.random() * (max - min) + min; // หยุดพักแบบสุ่ม
}

// ✅ 4️⃣ ฟังก์ชันหลักในการรัน Load Test
export default function () {
  const page = getRandomPage();
  const payload = JSON.stringify({
    oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
    company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
    page: page,
    size: PAGE_SIZE, // ใช้ Pagination เพื่อลดโหลด API
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
    `📡 Sent Request | Page: ${page} | Status: ${response.status} | ⏳ Response Time: ${response.timings.duration} ms`
  );

  // 🔹 ตรวจสอบค่าที่ได้
  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 1000ms": (r) => r.timings.duration < 1000,
    "response is not empty": (r) => r.body && r.body.length > 0,
  });

  // ✅ 5️⃣ ใช้ `sleep()` เพื่อลดความเร็วการยิง API
  sleep(getRandomDelay(3, 6)); // หยุดพักระหว่าง 3 - 6 วินาที
}
