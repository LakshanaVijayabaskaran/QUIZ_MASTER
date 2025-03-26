export default {
    name: "EditQuestion",
    props: ["quizId", "questionId","subjectId", "chapterId"],
    data() {
        return {
            question_statement: "",
            option1: "",
            option2: "",
            option3: "",
            option4: "",
            correct_option: null,
            errorMessage: "",
            successMessage: ""
        };
    },
    async created() {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/quiz/${this.quizId}/question/${this.questionId}`);
            const data = await response.json();

            if (response.ok) {
                this.question_statement = data.question_statement;
                this.option1 = data.option1;
                this.option2 = data.option2;
                this.option3 = data.option3;
                this.option4 = data.option4;
                this.correct_option = data.correct_option;
            } else {
                this.errorMessage = data.error || "Failed to fetch question details.";
            }
        } catch (error) {
            this.errorMessage = "Server error. Please try again later.";
        }
    },
    methods: {
        async updateQuestion() {
            if (!this.question_statement || !this.option1 || !this.option2 || !this.option3 || !this.option4 || this.correct_option === null) {
                this.errorMessage = "Please fill in all fields and select the correct option.";
                return;
            }

            const payload = {
                question_statement: this.question_statement,
                option1: this.option1,
                option2: this.option2,
                option3: this.option3,
                option4: this.option4,
                correct_option: this.correct_option
            };

            try {
                const response = await fetch(`http://127.0.0.1:5000/api/admin/quiz/${this.quizId}/question/${this.questionId}`, {
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
                    this.errorMessage = data.error || "Failed to update question.";
                }
            } catch (error) {
                this.errorMessage = "Server error. Please try again later.";
            }
        }
    },
    template: `
        <div>
            <h2>Edit Question</h2>
            <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
            <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

            <form @submit.prevent="updateQuestion">
                <div class="form-group">
                    <label>Question:</label>
                    <textarea v-model="question_statement" class="form-control" required></textarea>
                </div>

                <div class="form-group">
                    <label>Option 1:</label>
                    <input type="text" v-model="option1" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Option 2:</label>
                    <input type="text" v-model="option2" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Option 3:</label>
                    <input type="text" v-model="option3" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Option 4:</label>
                    <input type="text" v-model="option4" class="form-control" required>
                </div>

                <div class="form-group">
                    <label>Correct Option:</label>
                    <select v-model="correct_option" class="form-control" required>
                        <option value="1">Option 1</option>
                        <option value="2">Option 2</option>
                        <option value="3">Option 3</option>
                        <option value="4">Option 4</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-success mt-3">Update Question</button>
            </form>
        </div>
    `
};
