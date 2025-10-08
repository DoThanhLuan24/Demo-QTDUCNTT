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
    const courseMaxStudents = parseInt(
        document.getElementById("courseMaxStudents").value
    );

    // Validation
    if (appData.courses.find((c) => c.code === courseCode)) {
        showAlert("❌ Mã lớp đã tồn tại!", "error");
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

    // Kiểm tra trùng mã (nếu thay đổi)
    if (
        newCode !== oldCode &&
        appData.courses.find((c) => c.code === newCode)
    ) {
        showAlert("❌ Mã lớp đã tồn tại!", "error");
        return;
    }

    const updatedCourse = {
        ...appData.courses[courseIndex],
        name: document.getElementById("editCourseName").value.trim(),
        code: newCode,
        type: document.getElementById("editCourseType").value,
        instructor: document
            .getElementById("editCourseInstructor")
            .value.trim(),
        maxStudents: parseInt(
            document.getElementById("editCourseMaxStudents").value
        ),
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
    const highSchoolScore = parseFloat(
        document.getElementById("studentScore").value
    );
    const password = document.getElementById("studentPassword").value;

    // Validation
    if (appData.students.find((s) => s.studentId === studentId)) {
        showAlert("❌ Mã sinh viên đã tồn tại!", "error");
        return;
    }

    if (appData.students.find((s) => s.email === email)) {
        showAlert("❌ Email đã được sử dụng!", "error");
        return;
    }

    if (appData.students.find((s) => s.username === username)) {
        showAlert("❌ Tên đăng nhập đã được sử dụng!", "error");
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

function closeEditStudentModal() {
    document.getElementById("editStudentModal").classList.remove("active");
}

function handleEditStudent(e) {
    e.preventDefault();

    const originalId = document.getElementById("editStudentOriginalId").value;
    const studentIndex = appData.students.findIndex(
        (s) => s.studentId === originalId
    );

    if (studentIndex === -1) return;

    const newStudentId = document.getElementById("editStudentId").value.trim();
    const newEmail = document.getElementById("editStudentEmail").value.trim();
    const newPassword = document.getElementById("editStudentPassword").value;

    // Validation
    if (
        newStudentId !== originalId &&
        appData.students.find((s) => s.studentId === newStudentId)
    ) {
        showAlert("❌ Mã sinh viên đã tồn tại!", "error");
        return;
    }

    if (
        newEmail !== appData.students[studentIndex].email &&
        appData.students.find((s) => s.email === newEmail)
    ) {
        showAlert("❌ Email đã được sử dụng!", "error");
        return;
    }

    // Cập nhật enrollments và pending requests nếu thay đổi mã sinh viên
    if (newStudentId !== originalId) {
        appData.enrollments.forEach((enrollment) => {
            if (enrollment.studentId === originalId) {
                enrollment.studentId = newStudentId;
            }
        });
        appData.pendingRequests.forEach((request) => {
            if (request.studentId === originalId) {
                request.studentId = newStudentId;
            }
        });
        saveEnrollments();
        savePendingRequests();
    }

    const updatedStudent = {
        ...appData.students[studentIndex],
        studentId: newStudentId,
        fullName: document.getElementById("editStudentName").value.trim(),
        email: newEmail,
        highSchoolScore: parseFloat(
            document.getElementById("editStudentScore").value
        ),
    };

    // Cập nhật mật khẩu nếu có
    if (newPassword) {
        updatedStudent.password = newPassword;
    }

    appData.students[studentIndex] = updatedStudent;
    saveStudents();

    // Cập nhật trong users
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

    renderStudents();
    renderEnrollments();
    renderPendingRequests();
    closeEditStudentModal();
    showAlert("✅ Cập nhật sinh viên thành công!", "success");
    console.log("✏️ Đã cập nhật sinh viên:", newStudentId);
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

function closeManageStudentsModal() {
    document.getElementById("manageStudentsModal").classList.remove("active");
    appData.managingCourseId = null;
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
