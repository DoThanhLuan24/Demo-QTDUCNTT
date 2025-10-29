// ============================================
// DATA MANAGEMENT
// ============================================
let appData = {
    courses: [],
    students: [],
    enrollments: [],
    pendingRequests: [],
    currentUser: null,
    editingCourseId: null,
    managingCourseId: null,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showAlert(message, type) {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert--${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === "success" ? "#10b981" : "#ef4444"};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.animation = "slideOut 0.3s ease-out";
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

function closeEditStudentModal() {
    document.getElementById("editStudentModal").classList.remove("active");
}

function closeManageStudentsModal() {
    document.getElementById("manageStudentsModal").classList.remove("active");
    appData.managingCourseId = null;
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener("keydown", function (e) {
    // ESC để đóng modal
    if (e.key === "Escape") {
        closeEditModal();
        closeEditStudentModal();
        closeManageStudentsModal();
    }
});

function approveRequest(requestId) {
    const request = appData.pendingRequests.find((r) => r.id === requestId);
    if (!request) return;

    const student = appData.students.find(
        (s) => s.studentId === request.studentId
    );
    const course = appData.courses.find((c) => c.code === request.courseCode);

    if (!student || !course) {
        showAlert(
            "❌ Không tìm thấy thông tin sinh viên hoặc lớp học!",
            "error"
        );
        return;
    }

    // Kiểm tra lớp đã đầy chưa
    const currentEnrollments = appData.enrollments.filter(
        (e) => e.courseCode === course.code
    ).length;
    if (currentEnrollments >= course.maxStudents) {
        showAlert("❌ Lớp học đã đầy!", "error");
        return;
    }

    // Kiểm tra điều kiện đăng ký
    if (course.type === "official" && student.highSchoolScore < 5.0) {
        if (
            !confirm(
                `Sinh viên ${student.fullName} có điểm THPT ${student.highSchoolScore} (< 5.0). Vẫn muốn duyệt?`
            )
        ) {
            return;
        }
    }

    if (
        confirm(
            `Duyệt yêu cầu đăng ký của ${student.fullName} vào lớp ${course.name}?`
        )
    ) {
        // Tạo enrollment mới
        const newEnrollment = {
            id: Date.now(),
            studentId: request.studentId,
            courseCode: request.courseCode,
            enrollDate: new Date().toISOString(),
        };

        appData.enrollments.push(newEnrollment);
        saveEnrollments();

        // Xóa request
        appData.pendingRequests = appData.pendingRequests.filter(
            (r) => r.id !== requestId
        );
        savePendingRequests();

        updateStats();
        renderCourses();
        renderEnrollments();
        renderPendingRequests();
        showAlert(`✅ Đã duyệt đăng ký cho ${student.fullName}!`, "success");
        console.log("✓ Đã duyệt yêu cầu ID:", requestId);
    }
}

function rejectRequest(requestId) {
    const request = appData.pendingRequests.find((r) => r.id === requestId);
    if (!request) return;

    const student = appData.students.find(
        (s) => s.studentId === request.studentId
    );
    const course = appData.courses.find((c) => c.code === request.courseCode);

    if (
        confirm(
            `Từ chối yêu cầu đăng ký của ${
                student?.fullName || "sinh viên"
            } vào lớp ${course?.name || "lớp học"}?`
        )
    ) {
        appData.pendingRequests = appData.pendingRequests.filter(
            (r) => r.id !== requestId
        );
        savePendingRequests();

        updateStats();
        renderPendingRequests();
        showAlert("✅ Đã từ chối yêu cầu!", "success");
        console.log("✕ Đã từ chối yêu cầu ID:", requestId);
    }
}

function removeEnrollment(enrollmentId) {
    const enrollment = appData.enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return;

    const student = appData.students.find(
        (s) => s.studentId === enrollment.studentId
    );
    const course = appData.courses.find(
        (c) => c.code === enrollment.courseCode
    );

    if (
        confirm(
            `Xóa đăng ký của ${student?.fullName || "sinh viên"} khỏi lớp ${
                course?.name || "lớp học"
            }?`
        )
    ) {
        appData.enrollments = appData.enrollments.filter(
            (e) => e.id !== enrollmentId
        );
        saveEnrollments();

        updateStats();
        renderCourses();
        renderEnrollments();
        showAlert("✅ Đã xóa đăng ký!", "success");
        console.log("🗑️ Đã xóa đăng ký ID:", enrollmentId);
    }
}

// ============================================
// PENDING REQUESTS MANAGEMENT
// ============================================
function renderPendingRequests() {
    const tbody = document.getElementById("pendingRequestsBody");
    tbody.innerHTML = "";

    if (appData.pendingRequests.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="8" style="text-align: center; color: #999;">Không có yêu cầu chờ duyệt</td></tr>';
        return;
    }

    appData.pendingRequests.forEach((request, index) => {
        const student = appData.students.find(
            (s) => s.studentId === request.studentId
        );
        const course = appData.courses.find(
            (c) => c.code === request.courseCode
        );

        if (!student || !course) return;

        const requestDate = new Date(request.requestDate).toLocaleDateString(
            "vi-VN"
        );

        const row = `
            <tr>
                <td style="font-weight: 600;">${index + 1}</td>
                <td style="color: #667eea;">${student.studentId}</td>
                <td>${student.fullName}</td>
                <td style="color: #667eea;">${course.code}</td>
                <td>${course.name}</td>
                <td><span class="badge badge--${course.type}">${
            course.type === "remedial" ? "Tăng Cường" : "Chính Thức"
        }</span></td>
                <td>${requestDate}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn--success" onclick="approveRequest(${
                            request.id
                        })">✓ Duyệt</button>
                        <button class="btn btn--danger" onclick="rejectRequest(${
                            request.id
                        })">✕ Từ chối</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ============================================
// ENROLLMENT MANAGEMENT
// ============================================
function renderEnrollments() {
    const tbody = document.getElementById("enrollmentsTableBody");
    const filterCourse = document.getElementById("filterCourse").value;
    const filterStudent = document
        .getElementById("filterStudent")
        .value.toLowerCase();

    let filteredEnrollments = appData.enrollments;

    // Lọc theo lớp học
    if (filterCourse) {
        filteredEnrollments = filteredEnrollments.filter(
            (e) => e.courseCode === filterCourse
        );
    }

    // Lọc theo sinh viên
    if (filterStudent) {
        filteredEnrollments = filteredEnrollments.filter((e) => {
            const student = appData.students.find(
                (s) => s.studentId === e.studentId
            );
            if (!student) return false;
            return (
                student.fullName.toLowerCase().includes(filterStudent) ||
                student.studentId.toLowerCase().includes(filterStudent)
            );
        });
    }

    tbody.innerHTML = "";

    if (filteredEnrollments.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="8" style="text-align: center; color: #999;">Chưa có đăng ký nào được duyệt</td></tr>';
        return;
    }

    filteredEnrollments.forEach((enrollment, index) => {
        const student = appData.students.find(
            (s) => s.studentId === enrollment.studentId
        );
        const course = appData.courses.find(
            (c) => c.code === enrollment.courseCode
        );

        if (!student || !course) return;

        const enrollDate = new Date(enrollment.enrollDate).toLocaleDateString(
            "vi-VN"
        );

        const row = `
            <tr>
                <td style="font-weight: 600;">${index + 1}</td>
                <td style="color: #667eea;">${student.studentId}</td>
                <td>${student.fullName}</td>
                <td style="color: #667eea;">${course.code}</td>
                <td>${course.name}</td>
                <td><span class="badge badge--${course.type}">${
            course.type === "remedial" ? "Tăng Cường" : "Chính Thức"
        }</span></td>
                <td>${course.instructor}</td>
                <td>${enrollDate}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn--danger" onclick="removeEnrollment(${
                            enrollment.id
                        })">🗑️ Xóa</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function populateFilterOptions() {
    const filterCourse = document.getElementById("filterCourse");
    filterCourse.innerHTML = '<option value="">Tất cả lớp học</option>';

    appData.courses.forEach((course) => {
        const option = document.createElement("option");
        option.value = course.code;
        option.textContent = `${course.code} - ${course.name}`;
        filterCourse.appendChild(option);
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Khởi động ứng dụng Admin...");
    checkAuth();
    loadData();
    updateStats();
    renderCourses();
    renderStudents();
    renderPendingRequests();
    renderEnrollments();
    populateFilterOptions();

    // Event Listeners
    document
        .getElementById("courseForm")
        .addEventListener("submit", handleAddCourse);
    document
        .getElementById("editCourseForm")
        .addEventListener("submit", handleEditCourse);
    document
        .getElementById("studentForm")
        .addEventListener("submit", handleAddStudent);
    document
        .getElementById("editStudentForm")
        .addEventListener("submit", handleEditStudent);

    console.log("✅ Ứng dụng đã sẵn sàng!");
});

// ============================================
// AUTHENTICATION
// ============================================
function checkAuth() {
    const user = localStorage.getItem("currentUser");
    if (!user) {
        alert("⚠️ Vui lòng đăng nhập!");
        window.location.href = "register&login.html";
        return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== "admin") {
        alert("❌ Bạn không có quyền truy cập trang này!");
        window.location.href = "register&login.html";
        return;
    }

    appData.currentUser = userData;
    document.getElementById("userName").textContent =
        userData.name || userData.email;
    console.log("✅ Xác thực thành công:", userData.email);
}

function logout() {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
        localStorage.removeItem("currentUser");
        console.log("👋 Đăng xuất thành công!");
        window.location.href = "register&login.html";
    }
}

// ============================================
// DATA LOADING & SAVING
// ============================================
function loadData() {
    console.log("📂 Đang tải dữ liệu...");

    // Load Courses
    const savedCourses = localStorage.getItem("courses");
    if (savedCourses) {
        appData.courses = JSON.parse(savedCourses);
        console.log(`✅ Đã tải ${appData.courses.length} lớp học`);
    } else {
        // Dữ liệu mẫu
        appData.courses = [
            {
                id: 1,
                name: "Tiếng Anh Tăng Cường Cơ Bản",
                code: "ENG_TC_101",
                instructor: "Ms. Johnson",
                type: "remedial",
                maxStudents: 30,
            },
            {
                id: 2,
                name: "Tiếng Anh Chính Thức A1",
                code: "ENG_CT_A1",
                instructor: "Mr. Smith",
                type: "official",
                maxStudents: 35,
            },
        ];
        saveCourses();
        console.log("✅ Đã tạo dữ liệu mẫu cho lớp học");
    }

    // Load Students
    const savedStudents = localStorage.getItem("students");
    if (savedStudents) {
        appData.students = JSON.parse(savedStudents);
        console.log(`✅ Đã tải ${appData.students.length} sinh viên`);
    } else {
        appData.students = [];
        console.log("ℹ️ Chưa có sinh viên nào");
    }

    // Load Enrollments
    const savedEnrollments = localStorage.getItem("enrollments");
    if (savedEnrollments) {
        appData.enrollments = JSON.parse(savedEnrollments);
        console.log(`✅ Đã tải ${appData.enrollments.length} đăng ký`);
    } else {
        appData.enrollments = [];
        console.log("ℹ️ Chưa có đăng ký nào");
    }

    // Load Pending Requests
    const savedPendingRequests = localStorage.getItem("pendingRequests");
    if (savedPendingRequests) {
        appData.pendingRequests = JSON.parse(savedPendingRequests);
        console.log(
            `✅ Đã tải ${appData.pendingRequests.length} yêu cầu chờ duyệt`
        );
    } else {
        appData.pendingRequests = [];
        console.log("ℹ️ Chưa có yêu cầu nào");
    }
}

function saveCourses() {
    localStorage.setItem("courses", JSON.stringify(appData.courses));
    console.log("💾 Đã lưu danh sách lớp học");
}

function saveStudents() {
    localStorage.setItem("students", JSON.stringify(appData.students));

    // Đồng bộ với users
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    appData.students.forEach((student) => {
        const userIndex = users.findIndex(
            (u) => u.studentId === student.studentId
        );
        if (userIndex !== -1) {
            users[userIndex] = student;
        }
    });
    localStorage.setItem("users", JSON.stringify(users));

    console.log("💾 Đã lưu danh sách sinh viên");
}

function saveEnrollments() {
    localStorage.setItem("enrollments", JSON.stringify(appData.enrollments));
    console.log("💾 Đã lưu danh sách đăng ký");
}

function savePendingRequests() {
    localStorage.setItem(
        "pendingRequests",
        JSON.stringify(appData.pendingRequests)
    );
    console.log("💾 Đã lưu danh sách yêu cầu chờ duyệt");
}

// ============================================
// STATISTICS
// ============================================
function updateStats() {
    document.getElementById("totalCourses").textContent =
        appData.courses.length;
    document.getElementById("totalStudents").textContent =
        appData.students.length;
    document.getElementById("totalEnrollments").textContent =
        appData.enrollments.length;
    document.getElementById("totalPending").textContent =
        appData.pendingRequests.length;
}

// ============================================
// UTILITY: Escape HTML to prevent XSS
// ============================================
function escapeHtml(text) {
    if (text == null) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function removeStudentFromCourse(enrollmentId) {
    const enrollment = appData.enrollments.find((e) => e.id === enrollmentId);

    if (!enrollment) {
        showAlert("❌ Không tìm thấy thông tin đăng ký!", "error");
        return;
    }

    const student = appData.students.find(
        (s) => s.studentId === enrollment.studentId
    );

    const studentName = student?.fullName || "sinh viên";

    if (
        !confirm(
            `Bạn có chắc chắn muốn xóa "${studentName}" khỏi lớp này?\n\n⚠️ Hành động này không thể hoàn tác.`
        )
    ) {
        return;
    }

    appData.enrollments = appData.enrollments.filter(
        (e) => e.id !== enrollmentId
    );

    saveEnrollments();

    const course = appData.courses.find(
        (c) => c.id === appData.managingCourseId
    );

    if (course) {
        renderManageStudentsList(course);
    }

    updateStats();
    renderCourses();
    renderEnrollments();

    showAlert("✅ Đã xóa sinh viên khỏi lớp thành công!", "success");
}

// ============================================
// CẬP NHẬT RENDER MANAGE STUDENTS LIST
// ============================================
function renderManageStudentsList(course) {
    const tbody = document.getElementById("manageStudentsBody");

    if (!tbody) {
        console.error("Element manageStudentsBody not found");
        return;
    }

    tbody.innerHTML = "";

    const enrolledStudents = appData.enrollments.filter(
        (e) => e.courseCode === course.code
    );

    // Cập nhật thông tin sức chứa
    const capacityInfo = document.getElementById("courseCapacityInfo");
    if (capacityInfo) {
        const percentage = Math.round(
            (enrolledStudents.length / course.maxStudents) * 100
        );
        const statusColor =
            percentage >= 90
                ? "#dc2626"
                : percentage >= 70
                ? "#f59e0b"
                : "#10b981";
        capacityInfo.innerHTML = `
            <span style="color: ${statusColor}; font-weight: 600;">
                ${enrolledStudents.length}/${course.maxStudents} sinh viên (${percentage}%)
            </span>
        `;
    }

    if (enrolledStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #999; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                    <div>Chưa có sinh viên nào trong lớp</div>
                    <div style="margin-top: 8px; font-size: 14px;">
                        Nhấn nút "Thêm sinh viên vào lớp" để bắt đầu
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    enrolledStudents.forEach((enrollment, index) => {
        const student = appData.students.find(
            (s) => s.studentId === enrollment.studentId
        );

        if (!student) {
            console.warn(`Student with ID ${enrollment.studentId} not found`);
            return;
        }

        const enrollDate = new Date(enrollment.enrollDate).toLocaleDateString(
            "vi-VN"
        );
        const isQualified = student.highSchoolScore >= 5.0;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="font-weight: 600; text-align: center;">${index + 1}</td>
            <td style="color: #667eea; font-weight: 600;">${escapeHtml(
                student.studentId
            )}</td>
            <td>${escapeHtml(student.fullName)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td style="text-align: center;">
                <span class="score-badge ${
                    isQualified ? "qualified" : "unqualified"
                }">
                    ${student.highSchoolScore || "N/A"}
                </span>
            </td>
            <td style="text-align: center;">${enrollDate}</td>
            <td style="text-align: center;">
                <button class="btn btn--danger btn--small" data-enrollment-id="${
                    enrollment.id
                }" title="Xóa sinh viên khỏi lớp">
                    🗑️ Xóa
                </button>
            </td>
        `;

        const deleteBtn = row.querySelector("[data-enrollment-id]");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                removeStudentFromCourse(enrollment.id);
            });
        }

        tbody.appendChild(row);
    });
}

function addStudentToCourse(studentId) {
    const course = appData.courses.find(
        (c) => c.id === appData.managingCourseId
    );
    const student = appData.students.find((s) => s.studentId === studentId);

    if (!course || !student) {
        showAlert("❌ Không tìm thấy thông tin!", "error");
        return;
    }

    // Kiểm tra lớp đã đầy chưa
    const currentEnrollments = appData.enrollments.filter(
        (e) => e.courseCode === course.code
    ).length;

    if (currentEnrollments >= course.maxStudents) {
        showAlert("❌ Lớp học đã đầy!", "error");
        return;
    }

    // Kiểm tra sinh viên đã đăng ký chưa
    const alreadyEnrolled = appData.enrollments.some(
        (e) => e.courseCode === course.code && e.studentId === studentId
    );

    if (alreadyEnrolled) {
        showAlert("❌ Sinh viên đã có trong lớp này rồi!", "error");
        return;
    }

    // Kiểm tra điều kiện đăng ký
    if (course.type === "official" && student.highSchoolScore < 5.0) {
        if (
            !confirm(
                `⚠️ Cảnh báo:\n\n` +
                    `Sinh viên ${student.fullName} có điểm THPT ${student.highSchoolScore} (< 5.0).\n` +
                    `Lớp ${course.name} là lớp Chính Thức, yêu cầu điểm THPT ≥ 5.0.\n\n` +
                    `Bạn vẫn muốn thêm sinh viên này?`
            )
        ) {
            return;
        }
    }

    // Thêm enrollment mới
    const newEnrollment = {
        id: Date.now(),
        studentId: studentId,
        courseCode: course.code,
        enrollDate: new Date().toISOString(),
    };

    appData.enrollments.push(newEnrollment);
    saveEnrollments();

    // Cập nhật UI
    updateStats();
    renderCourses();
    renderEnrollments();
    renderManageStudentsList(course);
    renderAvailableStudents(course);

    showAlert(
        `✅ Đã thêm ${student.fullName} vào lớp ${course.name}!`,
        "success"
    );
    console.log(`➕ Added ${studentId} to ${course.code}`);
}

function renderAvailableStudents(course) {
    const container = document.getElementById("availableStudentsList");

    if (!container) {
        console.error("availableStudentsList not found");
        return;
    }

    // Lấy danh sách sinh viên đã đăng ký lớp này
    const enrolledStudentIds = appData.enrollments
        .filter((e) => e.courseCode === course.code)
        .map((e) => e.studentId);

    // Lấy danh sách sinh viên chưa đăng ký
    const availableStudents = appData.students.filter(
        (student) => !enrolledStudentIds.includes(student.studentId)
    );

    container.innerHTML = "";

    if (availableStudents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎓</div>
                <div class="empty-state-text">Không có sinh viên nào có thể thêm</div>
                <div class="empty-state-subtext">Tất cả sinh viên đã được đăng ký vào lớp này</div>
            </div>
        `;
        return;
    }

    availableStudents.forEach((student) => {
        const isQualified = student.highSchoolScore >= 5.0;
        const canEnroll = course.type === "remedial" || isQualified;

        const studentItem = document.createElement("div");
        studentItem.className = "available-student-item";

        studentItem.innerHTML = `
            <div class="student-info">
                <div class="student-info-main">
                    <span class="student-id">${escapeHtml(
                        student.studentId
                    )}</span>
                    <span class="student-name">${escapeHtml(
                        student.fullName
                    )}</span>
                </div>
                <div class="student-info-secondary">
                    <span>📧 ${escapeHtml(student.email)}</span>
                    <span class="student-score">
                        📊 Điểm THPT: 
                        <span class="score-badge ${
                            isQualified ? "qualified" : "unqualified"
                        }">
                            ${student.highSchoolScore || "N/A"}
                        </span>
                    </span>
                    ${
                        !canEnroll
                            ? '<span style="color: #dc2626;">⚠️ Không đủ điều kiện cho lớp Chính Thức</span>'
                            : ""
                    }
                </div>
            </div>
            <button 
                class="btn ${
                    canEnroll ? "btn--success" : "btn--warning"
                } btn--small" 
                onclick="addStudentToCourse('${student.studentId}')"
                ${
                    !canEnroll
                        ? 'title="Sinh viên chưa đủ điều kiện nhưng vẫn có thể thêm"'
                        : ""
                }
            >
                ${canEnroll ? "✓ Thêm" : "⚠️ Thêm (cảnh báo)"}
            </button>
        `;

        container.appendChild(studentItem);
    });
}

function searchAvailableStudents() {
    const searchInput = document.getElementById("searchStudentInput");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    const course = appData.courses.find(
        (c) => c.id === appData.managingCourseId
    );
    if (!course) return;

    const enrolledStudentIds = appData.enrollments
        .filter((e) => e.courseCode === course.code)
        .map((e) => e.studentId);

    let availableStudents = appData.students.filter(
        (student) => !enrolledStudentIds.includes(student.studentId)
    );

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
        availableStudents = availableStudents.filter(
            (student) =>
                student.studentId.toLowerCase().includes(searchTerm) ||
                student.fullName.toLowerCase().includes(searchTerm) ||
                student.email.toLowerCase().includes(searchTerm)
        );
    }

    const container = document.getElementById("availableStudentsList");
    if (!container) return;

    container.innerHTML = "";

    if (availableStudents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">Không tìm thấy sinh viên nào</div>
                <div class="empty-state-subtext">Thử tìm kiếm với từ khóa khác</div>
            </div>
        `;
        return;
    }

    availableStudents.forEach((student) => {
        const isQualified = student.highSchoolScore >= 5.0;
        const canEnroll = course.type === "remedial" || isQualified;

        const studentItem = document.createElement("div");
        studentItem.className = "available-student-item";

        studentItem.innerHTML = `
            <div class="student-info">
                <div class="student-info-main">
                    <span class="student-id">${escapeHtml(
                        student.studentId
                    )}</span>
                    <span class="student-name">${escapeHtml(
                        student.fullName
                    )}</span>
                </div>
                <div class="student-info-secondary">
                    <span>📧 ${escapeHtml(student.email)}</span>
                    <span class="student-score">
                        📊 Điểm THPT: 
                        <span class="score-badge ${
                            isQualified ? "qualified" : "unqualified"
                        }">
                            ${student.highSchoolScore || "N/A"}
                        </span>
                    </span>
                    ${
                        !canEnroll
                            ? '<span style="color: #dc2626;">⚠️ Không đủ điều kiện</span>'
                            : ""
                    }
                </div>
            </div>
            <button 
                class="btn ${
                    canEnroll ? "btn--success" : "btn--warning"
                } btn--small" 
                onclick="addStudentToCourse('${student.studentId}')"
            >
                ${canEnroll ? "✓ Thêm" : "⚠️ Thêm"}
            </button>
        `;

        container.appendChild(studentItem);
    });
}

// ============================================
// THÊM SINH VIÊN VÀO LỚP HỌC
// ============================================

function openAddStudentToCourse() {
    const course = appData.courses.find(
        (c) => c.id === appData.managingCourseId
    );
    if (!course) {
        showAlert("❌ Không tìm thấy thông tin lớp học!", "error");
        return;
    }

    // Kiểm tra lớp đã đầy chưa
    const currentEnrollments = appData.enrollments.filter(
        (e) => e.courseCode === course.code
    ).length;

    if (currentEnrollments >= course.maxStudents) {
        showAlert("❌ Lớp học đã đầy! Không thể thêm sinh viên.", "error");
        return;
    }

    const modalTitle = document.getElementById("addStudentModalTitle");
    if (modalTitle) {
        modalTitle.textContent = `Thêm sinh viên vào: ${course.name} (${currentEnrollments}/${course.maxStudents})`;
    }

    renderAvailableStudents(course);

    const modal = document.getElementById("addStudentToCourseModal");
    if (modal) {
        modal.classList.add("active");
    }
}

function closeAddStudentToCourseModal() {
    const modal = document.getElementById("addStudentToCourseModal");
    if (modal) {
        modal.classList.remove("active");
    }

    // Reset search
    const searchInput = document.getElementById("searchStudentInput");
    if (searchInput) {
        searchInput.value = "";
    }
}

function openManageStudents(courseId) {
    console.log("Opening manage students for course:", courseId);

    const course = appData.courses.find((c) => c.id === courseId);
    if (!course) {
        console.error("Course not found:", courseId);
        showAlert("❌ Không tìm thấy lớp học!", "error");
        return;
    }

    appData.managingCourseId = courseId;

    const modalTitle = document.getElementById("manageCourseTitle");
    if (modalTitle) {
        modalTitle.textContent = `Quản lý sinh viên: ${course.name} (${course.code})`;
    }

    renderManageStudentsList(course);

    const modal = document.getElementById("manageStudentsModal");
    if (modal) {
        modal.classList.add("active");
        console.log("Modal opened successfully");
    } else {
        console.error("Modal element not found!");
    }
}

// ============================================
// COURSE MANAGEMENT
// ============================================
function renderCourses() {
    const tbody = document.getElementById("coursesTableBody");
    tbody.innerHTML = "";

    if (appData.courses.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7" style="text-align: center; color: #999;">Chưa có lớp học nào</td></tr>';
        return;
    }

    appData.courses.forEach((course) => {
        const enrolledCount = appData.enrollments.filter(
            (e) => e.courseCode === course.code
        ).length;
        const isFull = enrolledCount >= course.maxStudents;

        const row = `
            <tr>
                <td style="font-weight: 600; color: #667eea;">${
                    course.code
                }</td>
                <td>${course.name}</td>
                <td><span class="badge badge--${course.type}">${
            course.type === "remedial" ? "Tăng Cường" : "Chính Thức"
        }</span></td>
                <td>${course.instructor}</td>
                <td>${enrolledCount}/${course.maxStudents}</td>
                <td><span class="badge badge--${isFull ? "full" : "active"}">${
            isFull ? "Đầy" : "Còn chỗ"
        }</span></td>
                <td>
                    <div class="actions">
                        <button class="btn btn--warning" onclick="openManageStudents(${
                            course.id
                        })">👥 Quản lý SV</button>
                        <button class="btn btn--info" onclick="openEditCourse(${
                            course.id
                        })">✏️ Sửa</button>
                        <button class="btn btn--danger" onclick="deleteCourse(${
                            course.id
                        })">🗑️ Xóa</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function handleAddCourse(e) {
    e.preventDefault();

    const courseName = document.getElementById("courseName").value.trim();
    const courseCode = document.getElementById("courseCode").value.trim();
    const courseType = document.getElementById("courseType").value;
    const courseInstructor = document
        .getElementById("courseInstructor")
        .value.trim();
    const courseMaxStudents = Number(
        document.getElementById("courseMaxStudents").value
    );

    // Validation
    if (appData.courses.find((c) => c.code === courseCode)) {
        showAlert("❌ Mã lớp đã tồn tại!", "error");
        return;
    }

    if (courseName === "") {
        showAlert("❌ Tên lớp không được để trống!", "error");
        return;
    }

    if (courseCode === "") {
        showAlert("❌ Mã lớp không được để trống!", "error");
        return;
    }

    if (courseType !== "remedial" && courseType !== "official") {
        showAlert("❌ Loại lớp không hợp lệ!", "error");
        return;
    }

    if (courseInstructor === "") {
        showAlert("❌ Tên giảng viên không được để trống!", "error");
        return;
    } else if (!/^[A-Za-zÀ-Ỵà-ỵ\s]+$/.test(courseInstructor)) {
        showAlert("❌ Tên giảng viên không hợp lệ!", "error");
        return;
    }

    if (isNaN(courseMaxStudents)) {
        showAlert("❌ Sức chứa lớp phải là 1 số từ 10 -> 120!", "error");
        return;
    } else if (!Number.isInteger(courseMaxStudents)) {
        showAlert("❌ Sức chứa lớp phải là số nguyên!", "error");
        return;
    } else if (courseMaxStudents <= 0) {
        showAlert("❌ Sức chứa lớp không được là số âm!", "error");
        return;
    } else if (courseMaxStudents < 10 || courseMaxStudents > 120) {
        showAlert("❌ Sức chứa lớp phải từ 10 đến 120 sinh viên!", "error");
        return;
    }

    const newCourse = {
        id: Date.now(),
        name: courseName,
        code: courseCode,
        type: courseType,
        instructor: courseInstructor,
        maxStudents: courseMaxStudents,
    };

    appData.courses.push(newCourse);
    saveCourses();
    document.getElementById("courseForm").reset();
    updateStats();
    renderCourses();
    renderEnrollments();
    populateFilterOptions();
    showAlert("✅ Thêm lớp học thành công!", "success");
    console.log("➕ Đã thêm lớp:", courseCode);
}

function openEditCourse(id) {
    const course = appData.courses.find((c) => c.id === id);
    if (!course) return;

    appData.editingCourseId = id;
    document.getElementById("editCourseId").value = course.id;
    document.getElementById("editCourseName").value = course.name;
    document.getElementById("editCourseCode").value = course.code;
    document.getElementById("editCourseType").value = course.type;
    document.getElementById("editCourseInstructor").value = course.instructor;
    document.getElementById("editCourseMaxStudents").value = course.maxStudents;

    document.getElementById("editCourseModal").classList.add("active");
}

function closeEditModal() {
    document.getElementById("editCourseModal").classList.remove("active");
    appData.editingCourseId = null;
}

function handleEditCourse(e) {
    e.preventDefault();

    const courseId = parseInt(document.getElementById("editCourseId").value);
    const courseIndex = appData.courses.findIndex((c) => c.id === courseId);

    if (courseIndex === -1) return;

    const oldCode = appData.courses[courseIndex].code;
    const newCode = document.getElementById("editCourseCode").value.trim();
    const newName = document.getElementById("editCourseName").value.trim();
    const newNameInstructor = document
        .getElementById("editCourseInstructor")
        .value.trim();
    const newMaxStudents = Number(
        document.getElementById("editCourseMaxStudents").value
    );

    // Kiểm tra trùng mã (nếu thay đổi)
    if (
        newCode !== oldCode &&
        appData.courses.find((c) => c.code === newCode)
    ) {
        showAlert("❌ Mã lớp đã tồn tại!", "error");
        return;
    }

    if (courseId === "") {
        showAlert("❌ Tên lớp không được để trống!", "error");
        return;
    }

    if (newCode === "") {
        showAlert("❌ Mã lớp không được để trống!", "error");
        return;
    }

    if (newName === "") {
        showAlert("❌ Tên lớp không được để trống!", "error");
        return;
    }

    if (newNameInstructor === "") {
        showAlert("❌ Tên giảng viên không được để trống!", "error");
        return;
    } else if (!/^[A-Za-zÀ-Ỵà-ỵ\s]+$/.test(newNameInstructor)) {
        showAlert("❌ Tên giảng viên không hợp lệ!", "error");
        return;
    }

    if (isNaN(newMaxStudents)) {
        showAlert("❌ Sức chứa lớp phải là 1 số nguyên từ 10 -> 120!", "error");
        return;
    } else if (!Number.isInteger(newMaxStudents)) {
        showAlert("❌ Sức chứa lớp phải là số nguyên!", "error");
        return;
    } else if (newMaxStudents <= 0) {
        showAlert("❌ Sức chứa lớp không được là số âm!", "error");
        return;
    } else if (newMaxStudents < 10 || newMaxStudents > 120) {
        showAlert("❌ Sức chứa lớp phải từ 10 đến 120 sinh viên!", "error");
        return;
    }

    const updatedCourse = {
        ...appData.courses[courseIndex],
        name: newName,
        code: newCode,
        type: document.getElementById("editCourseType").value,
        instructor: newNameInstructor,
        maxStudents: newMaxStudents,
    };

    // Cập nhật mã lớp trong enrollments và pending requests nếu thay đổi
    if (oldCode !== newCode) {
        appData.enrollments.forEach((enrollment) => {
            if (enrollment.courseCode === oldCode) {
                enrollment.courseCode = newCode;
            }
        });
        appData.pendingRequests.forEach((request) => {
            if (request.courseCode === oldCode) {
                request.courseCode = newCode;
            }
        });
        saveEnrollments();
        savePendingRequests();
    }

    appData.courses[courseIndex] = updatedCourse;
    saveCourses();
    renderCourses();
    renderEnrollments();
    renderPendingRequests();
    populateFilterOptions();
    closeEditModal();
    showAlert("✅ Cập nhật lớp học thành công!", "success");
    console.log("✏️ Đã cập nhật lớp:", newCode);
}

function deleteCourse(id) {
    const course = appData.courses.find((c) => c.id === id);
    if (!course) return;

    const enrollmentCount = appData.enrollments.filter(
        (e) => e.courseCode === course.code
    ).length;
    const pendingCount = appData.pendingRequests.filter(
        (r) => r.courseCode === course.code
    ).length;

    let confirmMessage = `Xóa lớp "${course.name}"?`;
    if (enrollmentCount > 0 || pendingCount > 0) {
        confirmMessage += `\n\nLớp này có ${enrollmentCount} sinh viên đã đăng ký và ${pendingCount} yêu cầu chờ duyệt. Tất cả sẽ bị xóa.`;
    }

    if (confirm(confirmMessage)) {
        appData.courses = appData.courses.filter((c) => c.id !== id);
        appData.enrollments = appData.enrollments.filter(
            (e) => e.courseCode !== course.code
        );
        appData.pendingRequests = appData.pendingRequests.filter(
            (r) => r.courseCode !== course.code
        );

        saveCourses();
        saveEnrollments();
        savePendingRequests();
        updateStats();
        renderCourses();
        renderEnrollments();
        renderPendingRequests();
        showAlert("✅ Đã xóa lớp học!", "success");
        console.log("🗑️ Đã xóa lớp:", course.code);
    }
}

function openEditStudent(studentId) {
    const student = appData.students.find((s) => s.studentId === studentId);
    if (!student) return;

    document.getElementById("editStudentOriginalId").value = student.studentId;
    document.getElementById("editStudentId").value = student.studentId;
    document.getElementById("editStudentName").value = student.fullName;
    document.getElementById("editStudentEmail").value = student.email;
    document.getElementById("editStudentScore").value = student.highSchoolScore;
    document.getElementById("editStudentPassword").value = "";

    document.getElementById("editStudentModal").classList.add("active");
}

function deleteStudent(studentId) {
    const student = appData.students.find((s) => s.studentId === studentId);
    if (!student) return;

    const enrollmentCount = appData.enrollments.filter(
        (e) => e.studentId === studentId
    ).length;
    const pendingCount = appData.pendingRequests.filter(
        (r) => r.studentId === studentId
    ).length;

    let confirmMessage = `Xóa sinh viên "${student.fullName}"?`;
    if (enrollmentCount > 0 || pendingCount > 0) {
        confirmMessage += `\n\nSinh viên này có ${enrollmentCount} lớp đã đăng ký và ${pendingCount} yêu cầu chờ duyệt. Tất cả sẽ bị xóa.`;
    }

    if (confirm(confirmMessage)) {
        appData.students = appData.students.filter(
            (s) => s.studentId !== studentId
        );
        saveStudents();

        appData.enrollments = appData.enrollments.filter(
            (e) => e.studentId !== studentId
        );
        saveEnrollments();

        appData.pendingRequests = appData.pendingRequests.filter(
            (r) => r.studentId !== studentId
        );
        savePendingRequests();

        // Xóa khỏi users
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const updatedUsers = users.filter((u) => u.studentId !== studentId);
        localStorage.setItem("users", JSON.stringify(updatedUsers));

        updateStats();
        renderStudents();
        renderCourses();
        renderEnrollments();
        renderPendingRequests();
        showAlert("✅ Đã xóa sinh viên!", "success");
        console.log("🗑️ Đã xóa sinh viên:", studentId);
    }
}

// ============================================
// STUDENT MANAGEMENT
// ============================================
function renderStudents() {
    const tbody = document.getElementById("studentsTableBody");
    tbody.innerHTML = "";

    if (appData.students.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7" style="text-align: center; color: #999;">Chưa có sinh viên nào</td></tr>';
        return;
    }

    appData.students.forEach((student) => {
        const canRegisterOfficial = student.highSchoolScore >= 5.0;
        const row = `
            <tr>
                <td style="font-weight: 600; color: #667eea;">${
                    student.studentId
                }</td>
                <td>${student.fullName}</td>
                <td>${student.username}</td>
                <td>${student.email}</td>
                <td>${student.highSchoolScore || "N/A"}</td>
                <td><span class="badge badge--${
                    canRegisterOfficial ? "active" : "remedial"
                }">${
            canRegisterOfficial ? "✅ Đủ điều kiện" : "⚠️ Cần Tăng Cường"
        }</span></td>
                <td>
                    <div class="actions">
                        <button class="btn btn--info" onclick="openEditStudent('${
                            student.studentId
                        }')">✏️ Sửa</button>
                        <button class="btn btn--danger" onclick="deleteStudent('${
                            student.studentId
                        }')">🗑️ Xóa</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function handleAddStudent(e) {
    e.preventDefault();
    let studentId = "SV" + (Math.floor(Math.random() * 90000) + 10000);
    console.log("Mã sinh viên tạo tự động:", studentId);

    const username = document.getElementById("userAccount").value.trim();
    const fullName = document.getElementById("studentName").value.trim();
    const email = document.getElementById("studentEmail").value.trim();
    let highSchoolScore = parseFloat(
        document.getElementById("studentScore").value
    );
    const password = document.getElementById("studentPassword").value;

    // Validation
    if (appData.students.find((s) => s.studentId === studentId)) {
        showAlert("❌ Mã sinh viên đã tồn tại!", "error");
        return;
    }

    if (fullName === "") {
        showAlert("❌ Họ tên không được để trống!", "error");
        return;
    } else if (!/^[\p{L}'][ \p{L}'-]*[\p{L}]$/u.test(fullName)) {
        showAlert(
            "❌ Họ tên không hợp lệ!Họ tên không được chứa ký tự đặc biệt hoặc số",
            "error"
        );
        return;
    }

    if (appData.students.find((s) => s.username === username)) {
        showAlert("❌ Tên đăng nhập đã được sử dụng!", "error");
        return;
    } else if (username === "") {
        showAlert("❌ Tên đăng nhập không được để trống!", "error");
        return;
    } else if (!/^[a-zA-Z0-9._-]{6,}$/.test(username)) {
        showAlert(
            "❌ Tên đăng nhập không hợp lệ! Tên đăng nhập phải có ít nhất 6 ký tự và không chứa ký tự đặc biệt.",
            "error"
        );
        return;
    }

    if (appData.students.find((s) => s.email === email)) {
        showAlert("❌ Email đã được sử dụng!", "error");
        return;
    } else if (email === "") {
        showAlert("❌ Email không được để trống!", "error");
        return;
    } else if (
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(
            email
        )
    ) {
        showAlert(
            "❌ Email không hợp lệ! Email sẽ có định dạng: example@domain.com",
            "error"
        );
        return;
    }

    if (isNaN(highSchoolScore)) {
        showAlert("❌ Điểm không hợp lệ! Vui lòng nhập số.", "error");
        return;
    } else if (highSchoolScore < 0 || highSchoolScore > 10) {
        showAlert(
            "❌ Điểm không hợp lệ! Điểm phải nằm trong khoảng từ 0 đến 10.",
            "error"
        );
        return;
    } else if (!/^\d+(\.\d{1,2})?$/.test(highSchoolScore)) {
        highSchoolScore = parseFloat(highSchoolScore).toFixed(2);
    } else if (highSchoolScore === null || highSchoolScore === "") {
        showAlert("❌ Vui lòng nhập điểm THPT!", "error");
        return;
    }

    if (password.length < 6) {
        showAlert("❌ Mật khẩu phải có ít nhất 6 ký tự!", "error");
        return;
    } else if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(
            password
        )
    ) {
        showAlert(
            "❌ Mật khẩu không hợp lệ! Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số.",
            "error"
        );
        return;
    } else if (password === "") {
        showAlert("❌ Mật khẩu không được để trống!", "error");
        return;
    }

    const newStudent = {
        username,
        studentId,
        fullName,
        email,
        password,
        highSchoolScore,
        role: "student",
        registeredCourses: [],
    };

    appData.students.push(newStudent);
    saveStudents();

    // Thêm vào danh sách users
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    users.push(newStudent);
    localStorage.setItem("users", JSON.stringify(users));

    document.getElementById("studentForm").reset();
    updateStats();
    renderStudents();
    showAlert("✅ Thêm sinh viên thành công!", "success");
    console.log("➕ Đã thêm sinh viên:", studentId);
}

function handleEditStudent(e) {
    e.preventDefault();

    const originalId = document
        .getElementById("editStudentOriginalId")
        .value.trim();
    const studentIndex = appData.students.findIndex(
        (s) => s.studentId === originalId
    );
    if (studentIndex === -1) return;
    console.log(originalId);

    // ----- Lấy input -----
    const newStudentId = document.getElementById("editStudentId").value.trim();
    const newEmail = document.getElementById("editStudentEmail").value.trim();
    const newPassword = document.getElementById("editStudentPassword").value;
    const newFullName = document.getElementById("editStudentName").value.trim();
    let rawScore = document.getElementById("editStudentScore").value.trim();
    const parsedScore = parseFloat(rawScore);

    console.log(newStudentId, newEmail, newFullName, rawScore);

    // ----- VALIDATION -----
    if (!newStudentId) {
        showAlert("❌ Mã sinh viên không được để trống!", "error");
        return;
    } else if (newStudentId.length !== 8) {
        showAlert(
            "❌ Mã sinh viên phải có 8 ký tự theo định dạng: SVxxxxx (x là số)!",
            "error"
        );
        return;
    } else if (!/^SV\d{6}$/.test(newStudentId)) {
        showAlert(
            "❌ Mã sinh viên không hợp lệ! Phải có dạng SVxxxxx (x là số)",
            "error"
        );
        return;
    } else if (
        newStudentId !== originalId &&
        appData.students.some((s) => s.studentId === newStudentId)
    ) {
        showAlert("❌ Mã sinh viên đã tồn tại!", "error");
        return;
    }

    if (!newEmail) {
        showAlert("❌ Email không được để trống!", "error");
        return;
    } else if (
        newEmail !== appData.students[studentIndex].email &&
        appData.students.some((s) => s.email === newEmail)
    ) {
        showAlert("❌ Email đã được sử dụng!", "error");
        return;
    } else if (
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(
            newEmail
        )
    ) {
        showAlert(
            "❌ Email không hợp lệ!Email sẽ có định dạng: example@domain.com",
            "error"
        );
        return;
    }

    if (!newFullName) {
        showAlert("❌ Họ tên không được để trống!", "error");
        return;
    } else if (!/^\p{L}+(\s\p{L}+)*$/u.test(newFullName)) {
        showAlert("❌ Họ tên không được chứa số hoặc ký tự đặc biệt!", "error");
        return;
    }

    if (rawScore === "" || rawScore === null) {
        showAlert("❌ Vui lòng nhập điểm THPT!", "error");
        return false;
    }

    // Kiểm tra có phải số không
    if (isNaN(parsedScore)) {
        showAlert("❌ Điểm THPT phải là một số!", "error");
        return false;
    }

    // Kiểm tra khoảng điểm 0 -> 10
    if (parsedScore < 0 || parsedScore > 10) {
        showAlert("❌ Điểm THPT phải từ 0 đến 10!", "error");
        return false;
    }

    // Kiểm tra định dạng: tối đa 2 chữ số thập phân
    if (!/^\d+(\.\d{1,2})?$/.test(rawScore)) {
        // Làm tròn đến 2 chữ số thập phân
        // rawScore = Math.round(parseFloat(rawScore) * 100) / 100;
        console.log("Điểm cũ:", rawScore);
        rawScore = parseFloat(rawScore).toFixed(2);
    }

    // Chuyển sang number để xử lý tiếp
    const highSchoolScore = parseFloat(rawScore);

    // ----- Cập nhật enrollments & pending requests nếu đổi studentId -----
    if (newStudentId !== originalId) {
        appData.enrollments.forEach((enrollment) => {
            if (enrollment.studentId === originalId)
                enrollment.studentId = newStudentId;
        });
        appData.pendingRequests.forEach((request) => {
            if (request.studentId === originalId)
                request.studentId = newStudentId;
        });
        saveEnrollments();
        savePendingRequests();
    }

    // ----- Cập nhật student -----
    const updatedStudent = {
        ...appData.students[studentIndex],
        studentId: newStudentId,
        fullName: newFullName,
        email: newEmail,
        highSchoolScore,
    };

    // Cập nhật password nếu có
    if (newPassword) updatedStudent.password = newPassword;
    if (newPassword !== "") {
        if (newPassword.length < 6) {
            showAlert("❌ Mật khẩu phải có ít nhất 6 ký tự!", "error");
            return;
        } else if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(
                newPassword
            )
        ) {
            showAlert(
                "❌ Mật khẩu không hợp lệ! Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số.",
                "error"
            );
            return;
        }
    }

    appData.students[studentIndex] = updatedStudent;
    saveStudents();

    // ----- Cập nhật users trong localStorage -----
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const userIndex = users.findIndex(
        (u) =>
            u.studentId === originalId ||
            u.email === appData.students[studentIndex].email
    );
    if (userIndex !== -1) {
        users[userIndex] = updatedStudent;
        localStorage.setItem("users", JSON.stringify(users));
    }

    // ----- Render lại UI -----
    renderStudents();
    renderEnrollments();
    renderPendingRequests();
    closeEditStudentModal();
    showAlert("✅ Cập nhật sinh viên thành công!", "success");
    console.log("✏️ Đã cập nhật sinh viên:", newStudentId);
}

// ============================================
// MANAGE STUDENTS IN COURSE
// ============================================
function openManageStudents(courseId) {
    const course = appData.courses.find((c) => c.id === courseId);
    if (!course) return;

    appData.managingCourseId = courseId;
    document.getElementById(
        "manageCourseTitle"
    ).textContent = `Quản lý sinh viên: ${course.name}`;

    renderManageStudentsList(course);
    document.getElementById("manageStudentsModal").classList.add("active");
}

function renderManageStudentsList(course) {
    const tbody = document.getElementById("manageStudentsBody");
    tbody.innerHTML = "";

    const enrolledStudents = appData.enrollments.filter(
        (e) => e.courseCode === course.code
    );

    if (enrolledStudents.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="5" style="text-align: center; color: #999;">Chưa có sinh viên nào trong lớp</td></tr>';
        return;
    }

    enrolledStudents.forEach((enrollment, index) => {
        const student = appData.students.find(
            (s) => s.studentId === enrollment.studentId
        );
        if (!student) return;

        const enrollDate = new Date(enrollment.enrollDate).toLocaleDateString(
            "vi-VN"
        );

        const row = `
            <tr>
                <td style="font-weight: 600;">${index + 1}</td>
                <td style="color: #667eea;">${student.studentId}</td>
                <td>${student.fullName}</td>
                <td>${student.email}</td>
                <td>${enrollDate}</td>
                <td>
                    <button class="btn btn--danger" onclick="removeStudentFromCourse(${
                        enrollment.id
                    })">🗑️ Xóa</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function removeStudentFromCourse(enrollmentId) {
    const enrollment = appData.enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return;

    const student = appData.students.find(
        (s) => s.studentId === enrollment.studentId
    );

    if (confirm(`Xóa ${student?.fullName || "sinh viên"} khỏi lớp này?`)) {
        appData.enrollments = appData.enrollments.filter(
            (e) => e.id !== enrollmentId
        );
        saveEnrollments();

        const course = appData.courses.find(
            (c) => c.id === appData.managingCourseId
        );
        if (course) {
            renderManageStudentsList(course);
        }

        updateStats();
        renderCourses();
        renderEnrollments();
        showAlert("✅ Đã xóa sinh viên khỏi lớp!", "success");
    }
}

// ============================================
// ENHANCED COURSE RENDERING (Cải tiến version hiện tại)
// ============================================
function renderCourses() {
    const tbody = document.getElementById("coursesTableBody");
    tbody.innerHTML = "";

    if (appData.courses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #999; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
                    <div>Chưa có lớp học nào</div>
                    <div style="margin-top: 8px; font-size: 14px;">Nhấn "Thêm lớp học" để bắt đầu</div>
                </td>
            </tr>
        `;
        return;
    }

    appData.courses.forEach((course) => {
        const enrolledCount = appData.enrollments.filter(
            (e) => e.courseCode === course.code
        ).length;
        const isFull = enrolledCount >= course.maxStudents;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="font-weight: 600; color: #667eea;">${escapeHtml(
                course.code
            )}</td>
            <td>${escapeHtml(course.name)}</td>
            <td><span class="badge badge--${course.type}">${
            course.type === "remedial" ? "Tăng Cường" : "Chính Thức"
        }</span></td>
            <td>${escapeHtml(course.instructor)}</td>
            <td style="text-align: center;">
                <span class="badge ${isFull ? "badge--danger" : "badge--info"}">
                    ${enrolledCount}/${course.maxStudents}
                </span>
            </td>
            <td>
                <span class="badge badge--${isFull ? "full" : "active"}">
                    ${isFull ? "Đầy" : "Còn chỗ"}
                </span>
            </td>
            <td>
                <div class="actions" style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn btn--primary btn--small" data-action="manage" data-course-id="${
                        course.id
                    }" title="Quản lý sinh viên">
                        👥 Quản lý SV
                    </button>
                    <button class="btn btn--info btn--small" data-action="edit" data-course-id="${
                        course.id
                    }" title="Chỉnh sửa">
                        ✏️ Sửa
                    </button>
                    <button class="btn btn--danger btn--small" data-action="delete" data-course-id="${
                        course.id
                    }" title="Xóa">
                        🗑️ Xóa
                    </button>
                </div>
            </td>
        `;

        // Event listeners (thay vì onclick inline)
        const manageBtn = row.querySelector('[data-action="manage"]');
        const editBtn = row.querySelector('[data-action="edit"]');
        const deleteBtn = row.querySelector('[data-action="delete"]');

        if (manageBtn)
            manageBtn.addEventListener("click", () =>
                openManageStudents(course.id)
            );
        if (editBtn)
            editBtn.addEventListener("click", () => openEditCourse(course.id));
        if (deleteBtn)
            deleteBtn.addEventListener("click", () => deleteCourse(course.id));

        tbody.appendChild(row);
    });
}

// ============================================
// ENHANCED MANAGE STUDENTS LIST
// ============================================
function renderManageStudentsList(course) {
    const tbody = document.getElementById("manageStudentsBody");

    if (!tbody) {
        console.error("Element manageStudentsBody not found");
        return;
    }

    tbody.innerHTML = "";

    const enrolledStudents = appData.enrollments.filter(
        (e) => e.courseCode === course.code
    );

    if (enrolledStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #999; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                    <div>Chưa có sinh viên nào trong lớp</div>
                    <div style="margin-top: 8px; font-size: 14px;">
                        Sinh viên sẽ xuất hiện ở đây sau khi bạn duyệt yêu cầu đăng ký
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    enrolledStudents.forEach((enrollment, index) => {
        const student = appData.students.find(
            (s) => s.studentId === enrollment.studentId
        );

        if (!student) {
            console.warn(`Student with ID ${enrollment.studentId} not found`);
            return;
        }

        const enrollDate = new Date(enrollment.enrollDate).toLocaleDateString(
            "vi-VN"
        );

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="font-weight: 600; text-align: center;">${index + 1}</td>
            <td style="color: #667eea; font-weight: 600;">${escapeHtml(
                student.studentId
            )}</td>
            <td>${escapeHtml(student.fullName)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td style="text-align: center;">${enrollDate}</td>
            <td style="text-align: center;">
                <button class="btn btn--danger btn--small" data-enrollment-id="${
                    enrollment.id
                }" title="Xóa sinh viên khỏi lớp">
                    🗑️ Xóa
                </button>
            </td>
        `;

        // Event listener cho nút xóa
        const deleteBtn = row.querySelector("[data-enrollment-id]");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                removeStudentFromCourse(enrollment.id);
            });
        }

        tbody.appendChild(row);
    });

    // Cập nhật số lượng sinh viên trong tiêu đề modal
    const modalTitle = document.getElementById("manageCourseTitle");
    if (modalTitle) {
        modalTitle.textContent = `Quản lý sinh viên: ${course.name} (${enrolledStudents.length}/${course.maxStudents})`;
    }
}

// ============================================
// ENHANCED REMOVE STUDENT FROM COURSE
// ============================================
function removeStudentFromCourse(enrollmentId) {
    const enrollment = appData.enrollments.find((e) => e.id === enrollmentId);

    if (!enrollment) {
        showAlert("❌ Không tìm thấy thông tin đăng ký!", "error");
        return;
    }

    const student = appData.students.find(
        (s) => s.studentId === enrollment.studentId
    );

    const course = appData.courses.find(
        (c) => c.id === appData.managingCourseId
    );

    const studentName = student?.fullName || "sinh viên";
    const courseName = course?.name || "lớp học";

    if (
        !confirm(
            `Bạn có chắc chắn muốn xóa "${studentName}" khỏi lớp "${courseName}"?\n\n` +
                `⚠️ Hành động này không thể hoàn tác.`
        )
    ) {
        return;
    }

    // Xóa enrollment
    appData.enrollments = appData.enrollments.filter(
        (e) => e.id !== enrollmentId
    );

    saveEnrollments();

    // Cập nhật lại danh sách
    if (course) {
        renderManageStudentsList(course);
    }

    // Cập nhật stats và các bảng khác
    updateStats();
    renderCourses();
    renderEnrollments();

    showAlert("✅ Đã xóa sinh viên khỏi lớp thành công!", "success");
    console.log(`🗑️ Đã xóa ${studentName} khỏi ${courseName}`);
}

// ============================================
// SEARCH & FILTER FUNCTIONS
// ============================================
function filterEnrollments() {
    renderEnrollments();
}

function clearFilters() {
    document.getElementById("filterCourse").value = "";
    document.getElementById("filterStudent").value = "";
    renderEnrollments();
}

// ============================================
// EXPORT DATA (Bonus feature)
// ============================================
function exportToCSV(type) {
    let csvContent = "data:text/csv;charset=utf-8,";
    let headers = [];
    let data = [];

    switch (type) {
        case "courses":
            headers = [
                "Mã lớp",
                "Tên lớp",
                "Loại",
                "Giảng viên",
                "Sĩ số tối đa",
                "Đã đăng ký",
            ];
            data = appData.courses.map((course) => {
                const enrolled = appData.enrollments.filter(
                    (e) => e.courseCode === course.code
                ).length;
                return [
                    course.code,
                    course.name,
                    course.type === "remedial" ? "Tăng Cường" : "Chính Thức",
                    course.instructor,
                    course.maxStudents,
                    enrolled,
                ];
            });
            break;

        case "students":
            headers = [
                "Mã SV",
                "Họ tên",
                "Email",
                "Điểm THPT",
                "Số lớp đã đăng ký",
            ];
            data = appData.students.map((student) => {
                const enrolledCount = appData.enrollments.filter(
                    (e) => e.studentId === student.studentId
                ).length;
                return [
                    student.studentId,
                    student.fullName,
                    student.email,
                    student.highSchoolScore || "N/A",
                    enrolledCount,
                ];
            });
            break;

        case "enrollments":
            headers = ["Mã SV", "Họ tên", "Mã lớp", "Tên lớp", "Ngày đăng ký"];
            data = appData.enrollments.map((enrollment) => {
                const student = appData.students.find(
                    (s) => s.studentId === enrollment.studentId
                );
                const course = appData.courses.find(
                    (c) => c.code === enrollment.courseCode
                );
                return [
                    student?.studentId || "N/A",
                    student?.fullName || "N/A",
                    course?.code || "N/A",
                    course?.name || "N/A",
                    new Date(enrollment.enrollDate).toLocaleDateString("vi-VN"),
                ];
            });
            break;
    }

    csvContent += headers.join(",") + "\n";
    data.forEach((row) => {
        csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
        "download",
        `${type}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert(`✅ Đã xuất ${type} thành công!`, "success");
}

// ============================================
// STATISTICS DETAILS (Bonus)
// ============================================
function showDetailedStats() {
    const totalSeats = appData.courses.reduce(
        (sum, course) => sum + course.maxStudents,
        0
    );
    const occupiedSeats = appData.enrollments.length;
    const occupancyRate =
        totalSeats > 0 ? ((occupiedSeats / totalSeats) * 100).toFixed(1) : 0;

    const remedialCourses = appData.courses.filter(
        (c) => c.type === "remedial"
    ).length;
    const officialCourses = appData.courses.filter(
        (c) => c.type === "official"
    ).length;

    const qualifiedStudents = appData.students.filter(
        (s) => s.highSchoolScore >= 5.0
    ).length;
    const unqualifiedStudents = appData.students.length - qualifiedStudents;

    const statsHTML = `
        <div class="stats-details">
            <h3>📊 Thống kê chi tiết</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <strong>Tổng số chỗ:</strong> ${totalSeats}
                </div>
                <div class="stat-item">
                    <strong>Đã sử dụng:</strong> ${occupiedSeats}
                </div>
                <div class="stat-item">
                    <strong>Tỷ lệ lấp đầy:</strong> ${occupancyRate}%
                </div>
                <div class="stat-item">
                    <strong>Lớp Tăng Cường:</strong> ${remedialCourses}
                </div>
                <div class="stat-item">
                    <strong>Lớp Chính Thức:</strong> ${officialCourses}
                </div>
                <div class="stat-item">
                    <strong>SV đủ điều kiện:</strong> ${qualifiedStudents}
                </div>
                <div class="stat-item">
                    <strong>SV cần Tăng Cường:</strong> ${unqualifiedStudents}
                </div>
            </div>
        </div>
    `;

    // Có thể hiển thị trong một modal hoặc alert
    alert(statsHTML.replace(/<[^>]*>/g, "\n"));
}

// ============================================
// VALIDATION HELPERS
// ============================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateStudentId(studentId) {
    const re = /^SV\d{5}$/;
    return re.test(studentId);
}

function validateCourseCode(code) {
    const re = /^[A-Z_]+\d+$/;
    return re.test(code);
}

// ============================================
// BACKUP & RESTORE DATA
// ============================================
function backupData() {
    const backup = {
        courses: appData.courses,
        students: appData.students,
        enrollments: appData.enrollments,
        pendingRequests: appData.pendingRequests,
        timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAlert("✅ Đã sao lưu dữ liệu thành công!", "success");
}

function restoreData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const backup = JSON.parse(e.target.result);

            if (
                confirm(
                    "Khôi phục dữ liệu sẽ ghi đè toàn bộ dữ liệu hiện tại. Tiếp tục?"
                )
            ) {
                appData.courses = backup.courses || [];
                appData.students = backup.students || [];
                appData.enrollments = backup.enrollments || [];
                appData.pendingRequests = backup.pendingRequests || [];

                saveCourses();
                saveStudents();
                saveEnrollments();
                savePendingRequests();

                updateStats();
                renderCourses();
                renderStudents();
                renderEnrollments();
                renderPendingRequests();
                populateFilterOptions();

                showAlert("✅ Khôi phục dữ liệu thành công!", "success");
            }
        } catch (error) {
            showAlert("❌ File không hợp lệ!", "error");
            console.error("Restore error:", error);
        }
    };
    reader.readAsText(file);
}

// ============================================
// ANIMATIONS FOR ALERTS
// ============================================
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .btn--small {
        padding: 6px 12px;
        font-size: 13px;
    }

    .badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
    }

    .badge--info {
        background-color: #e3f2fd;
        color: #1976d2;
    }

    .badge--danger {
        background-color: #ffebee;
        color: #c62828;
    }

    .actions {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
    }
`;
document.head.appendChild(style);

console.log("✅ Tất cả chức năng đã được tải!");

// Đảm bảo các hàm này có trong file JS của bạn

function closeManageStudentsModal() {
    const modal = document.getElementById("manageStudentsModal");
    if (modal) {
        modal.classList.remove("active");
    }
    appData.managingCourseId = null;
}

function renderManageStudentsList(course) {
    const tbody = document.getElementById("manageStudentsBody");

    if (!tbody) {
        console.error("Element manageStudentsBody not found");
        return;
    }

    tbody.innerHTML = "";

    const enrolledStudents = appData.enrollments.filter(
        (e) => e.courseCode === course.code
    );

    console.log("Enrolled students:", enrolledStudents.length);

    if (enrolledStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #999; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                    <div>Chưa có sinh viên nào trong lớp</div>
                    <div style="margin-top: 8px; font-size: 14px;">
                        Sinh viên sẽ xuất hiện ở đây sau khi bạn duyệt yêu cầu đăng ký
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    enrolledStudents.forEach((enrollment, index) => {
        const student = appData.students.find(
            (s) => s.studentId === enrollment.studentId
        );

        if (!student) {
            console.warn(`Student with ID ${enrollment.studentId} not found`);
            return;
        }

        const enrollDate = new Date(enrollment.enrollDate).toLocaleDateString(
            "vi-VN"
        );

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="font-weight: 600; text-align: center;">${index + 1}</td>
            <td style="color: #667eea; font-weight: 600;">${escapeHtml(
                student.studentId
            )}</td>
            <td>${escapeHtml(student.fullName)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td style="text-align: center;">${enrollDate}</td>
            <td style="text-align: center;">
                <button class="btn btn--danger btn--small" data-enrollment-id="${
                    enrollment.id
                }" title="Xóa sinh viên khỏi lớp">
                    🗑️ Xóa
                </button>
            </td>
        `;

        const deleteBtn = row.querySelector("[data-enrollment-id]");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                removeStudentFromCourse(enrollment.id);
            });
        }

        tbody.appendChild(row);
    });
}

function escapeHtml(text) {
    if (text == null) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Đóng modal khi click bên ngoài
document.addEventListener("click", function (e) {
    const modal = document.getElementById("manageStudentsModal");
    if (e.target === modal) {
        closeManageStudentsModal();
    }
});

// Đóng modal khi nhấn ESC
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeManageStudentsModal();
    }
});
