import Home from "../pages/home.js";
import AdminLogin from "../pages/AdminLogin.js";
import AdminDashboard from "../pages/AdminDashboard.js";
import UserDashboard from "../pages/UserDasboard.js";
import UserLogin from "../pages/UserLogin.js";
import Register from "../pages/Register.js";
import AddSubject from "../pages/AddSubject.js";
import EditSubject from "../pages/EditSubject.js";
import AddChapter from "../pages/AddChapter.js"; // ✅ Import AddChapter component
import EditChapter from "../pages/EditChapter.js"; // ✅ Import EditChapter component
import QuizManagementDashboard from "../pages/QuizManagementDashboard.js";
import AddQuiz from "../pages/AddQuiz.js";
import EditQuiz from "../pages/EditQuiz.js";
import AddQuestion from "../pages/AddQuestion.js";
import EditQuestion from "../pages/EditQuestion.js";
import AttemptQuiz from "../pages/AttemptQuiz.js"

const routes = [
    { path: "/", component: Home },
    { path: "/admin/login", component: AdminLogin },
    { path: "/admin/dashboard", component: AdminDashboard },
    { path: "/user/dashboard", component: UserDashboard },
    { path: "/user/login", component: UserLogin },
    { path: "/register", component: Register },
    { path: "/admin/add-subject", component: AddSubject }, // Route for adding a subject
    { path: "/admin/edit-subject/:id", component: EditSubject, props: true }, // Route for editing a subject
    { path: "/admin/subject/:subjectId/add-chapter", component: AddChapter, props: true }, // ✅ Route for adding a chapter
    { path: "/admin/subject/:subjectId/edit-chapter/:chapterId", component: EditChapter, props: true }, // ✅ Route for editing a chapter
    { path: "/admin/subject/:subjectId/chapter/:chapterId/quizzes", component: QuizManagementDashboard, props: true },
    { path: "/admin/subject/:subjectId/chapter/:chapterId/add-quiz", component: AddQuiz, props: true },
    { path: "/admin/subject/:subjectId/chapter/:chapterId/edit-quiz/:quizId", component: EditQuiz, props: true },
    { path: "/admin/subject/:subjectId/chapter/:chapterId/quiz/:quizId/add-question", component: AddQuestion, props: true },
    { path: "/admin/subject/:subjectId/chapter/:chapterId/quiz/:quizId/edit-question/:questionId",component: EditQuestion,props: true},
    
    { path: "/quiz/:quizId", component: AttemptQuiz },
    {
        path: "/logout",
        component: {
            template: `
                <div class="container text-center mt-5">
                    <h3>Logging out...</h3>
                </div>
            `,
            mounted() {
                if (this.$root && typeof this.$root.logout === "function") {
                    this.$root.logout();
                } else {
                    console.error("Logout function not found!");
                }
            }
        }
    }
];

const router = new VueRouter({
    mode: "hash",  // Keeps URLs compatible with file-based serving
    routes
});

export default router;
