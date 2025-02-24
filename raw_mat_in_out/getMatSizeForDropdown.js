import http from "k6/http";
import { check } from "k6";

// ✅ 1️⃣ การตั้งค่าการทดสอบ (Performance Test Configuration)
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp-up: เพิ่มจำนวนผู้ใช้เป็น 10 ใน 30 วินาที
    { duration: "1m", target: 50 }, // Steady-state: คงจำนวนผู้ใช้ที่ 50 เป็นเวลา 1 นาที
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% ของคำขอต้องใช้เวลาน้อยกว่า 500ms
    "http_req_duration{status:200}": ["p(95)<400"], // 95% ของคำขอสถานะ 200 ใช้เวลาน้อยกว่า 400ms
    http_reqs: ["count>100000"], // จำนวนคำขอทั้งหมดต้องมากกว่า 100,000
    checks: ["rate>0.90"], // 90% ของเงื่อนไขต้องผ่าน
  },
};

// ✅ 2️⃣ การกำหนดค่าตัวแปรและ Headers (Environment Variables)
const BASE_URL =
  "http://203.154.184.162:5013/api/materialSupplier/getMatSizeForDropdown";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDAzODI5NzksImV4cCI6MTc0MDQ2OTM3OX0.Gi2f0vsIpAK-lJ8M2XCiBzBMZL8qohg2VFfMIBkoIvg";
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
  const url = `${BASE_URL}/${oem_id}/${company_id}`;
  const params = getRequestParams();

  // ส่ง Request ไปที่ API
  const response = http.get(url, params);

  // ✅ 5️⃣ การตรวจสอบผลลัพธ์ (Validation & Logging)
  logRequest(url, response);
  validateResponse(response);
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
    "⏱ Response time < 500ms": (r) => r.timings.duration < 500,
  });
}
