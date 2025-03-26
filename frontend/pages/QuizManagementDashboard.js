export default {
  name: "QuizManagementDashboard",
  data() {
    return {
      quizzes: [],
      errorMessage: "",
      subjectId: null,
      chapterId: null,
      questions: {}, // Store questions for each quiz
    };
  },

  methods: {
    async fetchQuizzes() {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/admin/subject/${this.subjectId}/chapter/${this.chapterId}/quizzes`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
    
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server Error Response:", errorText);
          throw new Error("Failed to fetch quizzes");
        }
    
        // Parse response JSON
        const data = await response.json();
    
        // Check if API returned an error message
        if (data.message && data.message === "No quizzes available") {
          console.warn("No quizzes available, setting quizzes to an empty array.");
          this.quizzes = []; // Ensure it's an array
          this.errorMessage = "No quizzes available. Please add one.";
          return; // Stop execution
        }
    
        // Ensure data is always an array
        if (!Array.isArray(data)) {
          console.error("Unexpected API response:", data);
          throw new Error("Invalid quiz data received from the server.");
        }
    
        this.quizzes = data;
    
        // Fetch questions for each quiz
        this.quizzes.forEach(quiz => this.fetchQuestions(quiz.id));
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        this.errorMessage = "An error occurred while loading quizzes. Please try again.";
        this.quizzes = []; // Ensure it's always an array to avoid `.forEach` errors
      }
    }
    
    ,

    async fetchQuestions(quizId) {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/admin/quiz/${quizId}/questions`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }

        const questions = await response.json();
        this.$set(this.questions, quizId, questions.length > 0 ? questions : []);
      } catch (error) {
        console.error("Error fetching questions:", error);
        this.$set(this.questions, quizId, []);
      }
    },

    async deleteQuiz(quizId) {
      if (!confirm("Are you sure you want to delete this quiz?")) return;

      try {
        console.log("Deleting quiz with ID:", quizId);

        const response = await fetch(
          `http://127.0.0.1:5000/api/admin/subject/${this.subjectId}/chapter/${this.chapterId}/quiz/${quizId}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete quiz");
        }

        alert("Quiz deleted successfully.");
        this.fetchQuizzes();
      } catch (error) {
        console.error("Error deleting quiz:", error);
        alert(error.message);
      }
    },

    goToAddQuiz() {
      this.$router.push(
        `/admin/subject/${this.subjectId}/chapter/${this.chapterId}/add-quiz`
      );
    },

    goToEditQuiz(quizId) {
      this.$router.push(
        `/admin/subject/${this.subjectId}/chapter/${this.chapterId}/edit-quiz/${quizId}`
      );
    },

    goToAddQuestion(quizId) {
      this.$router.push(
        `/admin/subject/${this.subjectId}/chapter/${this.chapterId}/quiz/${quizId}/add-question`
      );
    },

    editQuestion(quizId,questionId) {
      this.$router.push(`/admin/subject/${this.subjectId}/chapter/${this.chapterId}/quiz/${quizId}/edit-question/${questionId}`);
    },

    async deleteQuestion(quizId,questionId) {
      if (!confirm("Are you sure you want to delete this question?")) return;

      try {
        const response = await fetch(`http://127.0.0.1:5000/api/admin/quiz/${quizId}/question/${questionId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete question");

        this.fetchQuizzes();
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    },
  },

  mounted() {
    this.subjectId = this.$route.params.subjectId;
    this.chapterId = this.$route.params.chapterId;
    this.fetchQuizzes();
  },

  template: `
    <div>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="#">Quiz Management</a>
      </div>
    </nav>

    <!-- Content -->
    <div class="container mt-4">
      <h2 class="mb-4">Quizzes</h2>

      <!-- Error Message -->
      <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

      <!-- Add Quiz Button -->
      <button class="btn btn-success mb-3" @click="goToAddQuiz">Add Quiz</button>

      <!-- Quizzes Display -->
      <div class="row">
        <div class="col-md-6 mb-4" v-for="quiz in quizzes" :key="quiz.id">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">
                Quiz titled {{ quiz.name }} {{ quiz.date_of_quiz }} ({{ quiz.time_duration }} min)
              </h5>

              <!-- Action Buttons -->
              <div class="mb-3">
                <button class="btn btn-primary btn-sm me-2" @click="goToEditQuiz(quiz.id)">Edit</button>
                <button class="btn btn-danger btn-sm me-2" @click="deleteQuiz(quiz.id)">Delete</button>
                <button class="btn btn-success btn-sm" @click="goToAddQuestion(quiz.id)">Add Questions</button>
              </div>

              <!-- Questions Section -->

              <div v-if="questions[quiz.id]" class="mt-3">
                <h6 class="text-muted">Questions</h6>
                <div v-if="questions[quiz.id].length > 0">
                  <ul class="list-group">
                    <li v-for="question in questions[quiz.id]" :key="question.id" class="list-group-item">
                      <strong>{{ question.question_statement }}</strong>
                      <div class="small">Options: {{ question.options.join(', ') }}</div>
                      <div class="small text-success">Correct: {{ question.correct_option }}</div>
                      <div class="mt-2">
                        <button class="btn btn-warning btn-sm me-2" @click="editQuestion(quiz.id, question.id)">Edit</button>
                        <button class="btn btn-danger btn-sm" @click="deleteQuestion(quiz.id, question.id)">Delete</button>
                      </div>
                    </li>
                  </ul>
                </div>
                <div v-else class="text-muted">
                  <em>No questions added yet.</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No quizzes available message -->
      <div v-if="quizzes.length === 0" class="text-center text-muted">
        No quizzes found.
      </div>
    </div>
  </div>
  `,
};
