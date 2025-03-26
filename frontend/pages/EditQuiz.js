export default {
    name: "EditQuiz",
    props: ["quizId", "subjectId", "chapterId"],
    data() {
        return {
            name: "",
            date_of_quiz: "",
            time_duration: "",
            errorMessage: "",
            successMessage: ""
        };
    },
    async created() {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/quiz/${this.quizId}`);
            const data = await response.json();

            if (response.ok) {
                this.name = data.name;  // Added quiz name
                this.date_of_quiz = data.date_of_quiz;
                this.time_duration = data.time_duration;
            } else {
                this.errorMessage = data.error || "Failed to fetch quiz details.";
            }
        } catch (error) {
            this.errorMessage = "Server error. Please try again later.";
        }
    },
    methods: {
        async updateQuiz() {
            if (!this.name || !this.date_of_quiz || !this.time_duration) {
                this.errorMessage = "Please fill in all fields.";
                return;
            }

            const payload = {
                name: this.name,  // Included quiz name
                date_of_quiz: this.date_of_quiz,
                time_duration: this.time_duration
            };

            try {
                const response = await fetch(`http://127.0.0.1:5000/api/admin/quiz/${this.quizId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    this.successMessage = data.message;
                    this.errorMessage = "";
                    setTimeout(() => this.$router.push(`/admin/subject/${this.subjectId}/chapter/${this.chapterId}/quizzes`), 1500);
                } else {
                    this.errorMessage = data.error || "Failed to update quiz.";
                }
            } catch (error) {
                this.errorMessage = "Server error. Please try again later.";
            }
        }
    },
    template: `
        <div class="container mt-4">
            <h2 class="mb-3">Edit Quiz</h2>
            <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
            <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

            <form @submit.prevent="updateQuiz" class="card p-3 shadow">
                <div class="form-group">
                    <label>Quiz Name:</label>
                    <input type="text" v-model="name" class="form-control" placeholder="Enter quiz name" required>
                </div>
                <div class="form-group">
                    <label>Date of Quiz:</label>
                    <input type="date" v-model="date_of_quiz" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Time Duration (HH:MM):</label>
                    <input type="text" v-model="time_duration" class="form-control" placeholder="e.g. 01:30" required>
                </div>
                <button type="submit" class="btn btn-success mt-3">Update Quiz</button>
            </form>
        </div>
    `
};
