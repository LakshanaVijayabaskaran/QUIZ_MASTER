export default {
  data() {
    return {
      quizId: this.$route.params.quizId,
      questions: [],
      userAnswers: {},
      currentQuestionIndex: 0,
      timeRemaining: 0, // Timer starts after fetching quiz data
      timer: null,
      alreadyAttempted: false, // Track if the quiz was already attempted
    };
  },
  computed: {
    formattedTime() {
      let minutes = Math.floor(this.timeRemaining / 60);
      let seconds = this.timeRemaining % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  },
  created() {
    this.checkAttemptStatus(); // Check if the user has already attempted the quiz
  },
  methods: {
    async checkAttemptStatus() {
      try {
        const response = await fetch(`/api/user/quizzes/${this.quizId}/attempt-status`);
        const data = await response.json();
        
        
        this.fetchQuestions(); // Fetch questions if the quiz is not attempted
        
      } catch (error) {
        console.error("Error checking quiz attempt status:", error);
      }
    },
    async fetchQuestions() {
      try {
        const response = await fetch(`/api/user/quizzes/${this.quizId}/questions`);
        const data = await response.json();
    
        console.log("Quiz Data:", data); // Debugging log
    
        if (!data.time_duration || isNaN(data.time_duration)) {
          console.error("Invalid or missing time_duration:", data.time_duration);
          return;
        }
    
        this.questions = data.questions;
        this.timeRemaining = parseInt(data.time_duration) * 60; // Convert minutes to seconds
        console.log("Timer set for:", this.timeRemaining, "seconds"); // Debug log
        this.startTimer();
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    }
    
    ,
    startTimer() {
      if (this.timer) clearInterval(this.timer); // Clear any existing timer
      this.timer = setInterval(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
        } else {
          clearInterval(this.timer);
          this.submitQuiz();
        }
      }, 1000);
    },
    async submitQuiz() {
      clearInterval(this.timer);
      try {
        const response = await fetch(`/api/user/quizzes/${this.quizId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: this.userAnswers }),
        });

        const data = await response.json();
        alert("Quiz submitted successfully!");
        this.$router.push("/user/dashboard"); // Redirect user to dashboard
      } catch (error) {
        console.error("Error submitting quiz:", error);
      }
    }
  },
  template: `
    <div class="container mt-4">
      <h2 class="text-center mb-3">Attempt Quiz</h2>
      
      <!-- Timer and Question Number -->
      <div class="d-flex justify-content-between">
        <span class="badge bg-primary p-2">Q. No. <span class="fw-bold">{{ currentQuestionIndex + 1 }}/{{ questions.length }}</span></span>
        <span class="badge bg-info p-2">🕒 {{ formattedTime }}</span>
      </div>

      <!-- Question Box -->
      <div class="card mt-3 p-4 shadow">
        <h4 class="text-center">{{ questions[currentQuestionIndex]?.question_statement }}</h4>
        
        <div class="list-group mt-3">
          <label v-for="(option, index) in questions[currentQuestionIndex]?.options" :key="index" class="list-group-item">
            <input type="radio" :name="'question-' + currentQuestionIndex" :value="option" 
                   v-model="userAnswers[questions[currentQuestionIndex]?.id]" class="form-check-input me-2"
                   :disabled="alreadyAttempted"> <!-- Disable input if already attempted -->
            {{ option }}
          </label>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-secondary" @click="currentQuestionIndex--" :disabled="currentQuestionIndex === 0">⬅ Prev</button>
        <button class="btn btn-primary" @click="currentQuestionIndex++" v-if="currentQuestionIndex < questions.length - 1">Save & Next ➡</button>
        <button class="btn btn-success" @click="submitQuiz" v-if="currentQuestionIndex === questions.length - 1 && !alreadyAttempted">Submit ✅</button>
      </div>
    </div>
  `
};
