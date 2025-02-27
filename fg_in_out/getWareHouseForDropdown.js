import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ ปรับจำนวน Virtual Users ให้สมดุล
export const options = {
  stages: [
    { duration: "5m", target: 500 },
    { duration: "5m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<700"], // ปรับ Response Time ให้อยู่ใน 700ms
    "http_req_duration{status:200}": ["p(90)<600"],
    http_reqs: ["count<50000"], // จำกัดจำนวน Requests รวม
  },
};

// ✅ 2️⃣ การกำหนดค่าตัวแปรและ Headers (Environment Variables)
const BASE_URL = "http://203.154.184.162:5012/api/warehouse/getAll";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2NzM1MTAsImV4cCI6MTc0MDc1OTkxMH0.OSIfb6QOnRxADVUxVxnLU8rSfohcI_uwGie-SU6wsFA";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// ค่าเฉพาะของผู้ใช้ (Dynamic Parameters)
const oem_id = "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4";
const company_id = "1a947e52-07ad-44fb-baca-aa24741512c3";

// ✅ 3️⃣ ฟังก์ชันช่วยเหลือ (Helper Functions)
function getRequestParams() {
  return {
    headers: {
      Authorization: AUTH_TOKEN,
      "X-TTT-PMRP": X_TTT_PMRP,
    },
  };
}

// ✅ 4️⃣ ฟังก์ชันหลัก (Main Load Test Function)
export default function () {
  const url = `${BASE_URL}/${company_id}/${oem_id}`;
  const params = getRequestParams();

  // ส่ง Request ไปที่ API
  const response = http.get(url, params);

  // ✅ 5️⃣ การตรวจสอบผลลัพธ์ (Validation & Logging)
  logRequest(url, response);
  validateResponse(response);

  // ✅ 6️⃣ ใช้ `sleep()` เพื่อลดความถี่ของ Requests
  sleep(getRandomDelay(5, 12)); // หยุดพักระหว่าง 5 - 12 วินาที
}

// 📌 ฟังก์ชัน: บันทึกข้อมูลการ Request
function logRequest(url, response) {
  console.log(`🟢 [Request] URL: ${url}`);
  console.log(
    `📡 [Response] Status: ${response.status} | Time: ${response.timings.duration}ms`
  );

  // แจ้งเตือนหากเซิร์ฟเวอร์ล่ม
  if (response.status >= 500) {
    console.error(`🔥 [ERROR] Server Down! Status: ${response.status}`);
  }
}

// 📌 ฟังก์ชัน: ตรวจสอบผลลัพธ์ของการทดสอบ
function validateResponse(response) {
  check(response, {
    "✅ Status is 200": (r) => r.status === 200,
    "⏱ Response time < 700ms": (r) => r.timings.duration < 700,
  });
}

// 📌 ฟังก์ชัน: สุ่ม `sleep()` เพื่อลดโหลดเซิร์ฟเวอร์
function getRandomDelay(min, max) {
  return Math.random() * (max - min) + min;
}
