export default {
  name: "UserDashboard",
  data() {
    return {
      subjects: [],
      chapters: [],
      quizzes: [],
      selectedSubject: null,
      selectedChapter: null,
      searchQuery: "",
      quizDetails: null, // Holds quiz details and scores
      previousAttempts: [], // Holds previous attempt details
      showModal: false,  // Controls modal visibility
    };
  },

  methods: {
    // Fetch all subjects
    async fetchSubjects() {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/user/subject");
        this.subjects = await response.json();
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    },

    // Fetch chapters for a selected subject
    async fetchChapters(subjectId) {
      this.selectedSubject = subjectId;
      this.selectedChapter = null; // Reset previous chapter selection
      this.quizzes = []; // Clear quiz list

      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/user/subjects/${subjectId}/chapters`
        );
        this.chapters = await response.json();
      } catch (error) {
        console.error("Error fetching chapters:", error);
      }
    },

    // Fetch quizzes for a selected chapter
    async fetchQuizzes(chapterId) {
      this.selectedChapter = chapterId;

      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/user/chapters/${chapterId}/quizzes`
        );
        this.quizzes = await response.json();
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
    },

    // Fetch Quiz Details and Previous Attempt History
    async viewQuizDetails(quiz) {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/user/quizzes/${quiz.id}/score`
        );
        const data = await response.json();

        this.quizDetails = {
          name: quiz.name,
          num_questions: quiz.num_questions,
          date: quiz.date_of_quiz,
          duration: quiz.time_duration,
          max_score: data.max_score,
          attempts: data.attempt_count,
        };

        // Fetch Previous Quiz Attempts
        this.previousAttempts = data.attempts || []; // Ensure array format

        this.showModal = true; // Show modal
      } catch (error) {
        console.error("Error fetching quiz details:", error);
      }
    },

    // Start quiz
    startQuiz(quizId) {
      this.$router.push(`/quiz/${quizId}`);
    },

    // Close Modal
    closeModal() {
      this.showModal = false;
    },
  },

  mounted() {
    this.fetchSubjects();
  },

  template: `
    <div class="container mt-4">
      <h2 class="mb-3">User Dashboard</h2>

      <!-- Subject Buttons -->
      <div class="mb-3">
        <h4>Select Subject:</h4>
        <div class="d-flex flex-wrap">
          <button 
            v-for="subject in subjects" 
            :key="subject.id" 
            class="btn btn-primary m-2"
            @click="fetchChapters(subject.id)">
            {{ subject.name }}
          </button>
        </div>
      </div>

      <!-- Chapters List -->
      <div v-if="chapters.length > 0" class="mb-3">
        <h4>Select Chapter:</h4>
        <div class="d-flex flex-wrap">
          <button 
            v-for="chapter in chapters" 
            :key="chapter.id" 
            class="btn btn-secondary m-2"
            @click="fetchQuizzes(chapter.id)">
            {{ chapter.name }}
          </button>
        </div>
      </div>

      <!-- Quiz List -->
      <div v-if="quizzes.length > 0" class="mt-3">
        <table class="table table-bordered">
          <thead class="table-dark">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>No. of Questions</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="quiz in quizzes" :key="quiz.id">
              <td>{{ quiz.id }}</td>
              <td>{{ quiz.name }}</td>
              <td>{{ quiz.num_questions }}</td>
              <td>{{ quiz.date_of_quiz }}</td>
              <td>{{ quiz.time_duration }} min</td>
              <td>
                <button class="btn btn-info btn-sm" @click="viewQuizDetails(quiz)">View</button>
                <button class="btn btn-success btn-sm ms-2" @click="startQuiz(quiz.id)">Start</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal for Quiz Details -->
      <div v-if="showModal" class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Quiz Details</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <table class="table table-bordered">
                <tr><th>Name:</th><td>{{ quizDetails.name }}</td></tr>
                <tr><th>No. of Questions:</th><td>{{ quizDetails.num_questions }}</td></tr>
                <tr><th>Date:</th><td>{{ quizDetails.date }}</td></tr>
                <tr><th>Duration:</th><td>{{ quizDetails.duration }} min</td></tr>
                <tr><th>Max Score:</th><td>{{ quizDetails.max_score }}</td></tr>
                <tr><th>Total Attempts:</th><td>{{ quizDetails.attempts }}</td></tr>
              </table>

              <!-- Previous Attempts Table -->
              <h5 class="mt-3">Previous Attempts</h5>
              <table class="table table-bordered">
                <thead class="table-light">
                  <tr>
                    <th>Attempt #</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(attempt, index) in previousAttempts" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td>{{ attempt.score }}</td>
                    <td>{{ attempt.date }}</td>
                  </tr>
                  <tr v-if="previousAttempts.length === 0">
                    <td colspan="3" class="text-center text-muted">No attempts yet</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeModal">Close</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Backdrop -->
      <div v-if="showModal" class="modal-backdrop fade show"></div>
    </div>
  `,
};
