import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ ปรับจำนวน Virtual Users และเพิ่ม Ramp-up ให้สมดุล
export const options = {
  stages: [
    { duration: "5m", target: 1000 },
    { duration: "2m", target: 2000 },
    { duration: "1m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<700"], // ปรับ Response Time ให้อยู่ใน 700ms
    "http_req_duration{status:200}": ["p(90)<600"],
    http_reqs: ["count<10000"], // จำกัดจำนวน Requests รวม
  },
};

const BASE_URL = "http://203.154.184.162:5012/api/purchaseOrder/getToolingPO";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2NzM1MTAsImV4cCI6MTc0MDc1OTkxMH0.OSIfb6QOnRxADVUxVxnLU8rSfohcI_uwGie-SU6wsFA";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// ✅ 2️⃣ ใช้ Random Delay เพื่อลดภาระเซิร์ฟเวอร์
function getRandomDelay(min, max) {
  return Math.random() * (max - min) + min;
}

// ✅ 3️⃣ ฟังก์ชันหลักสำหรับ Load Test
export default function () {
  const payload = JSON.stringify({
    t_start_date: "",
    t_end_date: "",
    t_po_no: "",
    t_supplier: "",
    t_recieve_status: "",
    oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
    company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
    page: Math.floor(Math.random() * 5) + 1, // สุ่มดึงข้อมูลหน้า 1-5
    size: 10,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_TOKEN,
      "X-TTT-PMRP": X_TTT_PMRP,
    },
  };

  // 🔹 ส่งคำขอ POST เพื่อดึงข้อมูล
  const response = http.post(BASE_URL, payload, params);

  // 🔹 Log ข้อมูลแต่ละ Status
  console.log(
    `📡 Sent Request | Status: ${response.status} | ⏳ Response Time: ${response.timings.duration} ms`
  );

  // 🔹 ตรวจสอบค่าที่ได้
  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 700ms": (r) => r.timings.duration < 700,
    "response is not empty": (r) => r.body && r.body.length > 0,
  });

  // ✅ 4️⃣ ใช้ `sleep()` เพื่อลดความถี่ของ Requests
  sleep(getRandomDelay(5, 12)); // หยุดพักระหว่าง 5 - 12 วินาที
}
