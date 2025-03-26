export default {
    name: "AddQuiz",
    props: ["subjectId", "chapterId"],
    data() {
        return {
            name: "",  // Fixed Syntax: Changed `name; ""` to `name: ""`
            date_of_quiz: "",
            time_duration: "",
            errorMessage: "",
            successMessage: ""
        };
    },
    methods: {
        async submitQuiz() {
            if (!this.name || !this.date_of_quiz || !this.time_duration) {
                this.errorMessage = "Please fill in all fields.";
                return;
            }

            const payload = {
                name: this.name,  // Added quiz name to payload
                date_of_quiz: this.date_of_quiz,
                time_duration: this.time_duration
            };

            try {
                const response = await fetch(`http://127.0.0.1:5000/api/admin/subject/${this.subjectId}/chapter/${this.chapterId}/quiz`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    this.successMessage = data.message;
                    this.errorMessage = "";
                    setTimeout(() => this.$router.push(`/admin/subject/${this.subjectId}/chapter/${this.chapterId}/quizzes`), 100);
                } else {
                    this.errorMessage = data.error || "Failed to add quiz.";
                }
            } catch (error) {
                this.errorMessage = "Server error. Please try again later.";
            }
        }
    },
    template: `
        <div class="container mt-4">
            <h2 class="mb-3">Add New Quiz</h2>
            <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
            <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

            <form @submit.prevent="submitQuiz" class="card p-3 shadow">
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
                <button type="submit" class="btn btn-primary mt-3">Add Quiz</button>
            </form>
        </div>
    `
};
