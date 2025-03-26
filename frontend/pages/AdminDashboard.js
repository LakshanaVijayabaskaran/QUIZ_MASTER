export default {
  name: "AdminDashboard",
  data() {
    return { 
      subjects: [], 
      chapters: {},  // ✅ Store chapters for each subject
      errorMessage: "" 
    };
  },
  methods: {
    async fetchSubjects() {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/admin/subject", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server Error Response:", errorText);
          throw new Error("Failed to fetch subjects");
        }

        this.subjects = await response.json();

        // ✅ Fetch chapters for each subject
        this.subjects.forEach(subject => this.fetchChapters(subject.id));

      } catch (error) {
        console.error("Error fetching subjects:", error);
        this.errorMessage = "Failed to load subjects. Please try again.";
      }
    },

    async fetchChapters(subjectId) {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/admin/subject/${subjectId}/chapters`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error("Failed to fetch chapters");

        const data = await response.json();
        this.$set(this.chapters, subjectId, data); // ✅ Store chapters in reactive object

      } catch (error) {
        console.error(`Error fetching chapters for subject ${subjectId}:`, error);
        this.$set(this.chapters, subjectId, []); // Ensure chapters list exists
      }
    },

    async deleteSubject(subjectId) {
      if (!confirm("Are you sure you want to delete this subject?")) return;
    
      try {
        console.log("Deleting subject with ID:", subjectId);
    
        const response = await fetch(`http://127.0.0.1:5000/api/admin/subject/${subjectId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",  // ✅ Send session cookies
        });
    
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete subject");
        }
    
        alert("Subject deleted successfully.");
        this.fetchSubjects(); // Refresh subjects and chapters
      } catch (error) {
        console.error("Error deleting subject:", error);
        alert(error.message);
      }
    }
    ,async deleteChapter(subjectId, chapterId) {
      if (!confirm("Are you sure you want to delete this chapter?")) return;

      try {
        console.log("Deleting chapter with ID:", chapterId);

        const response = await fetch(`http://127.0.0.1:5000/api/admin/subject/${subjectId}/chapter/${chapterId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",  // ✅ Send session cookies
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete chapter");
        }

        alert("Chapter deleted successfully.");
        this.fetchChapters(subjectId); // Refresh chapters after deletion
      } catch (error) {
        console.error("Error deleting chapter:", error);
        alert(error.message);
      }
    },

    goToAddSubject() {
      this.$router.push("/admin/add-subject");
    },

    goToEditSubject(subjectId) {
      this.$router.push(`/admin/edit-subject/${subjectId}`);
    },

    goToAddChapter(subjectId) {
      this.$router.push(`/admin/subject/${subjectId}/add-chapter`);
    },

    goToEditChapter(subjectId, chapterId) {
      this.$router.push(`/admin/subject/${subjectId}/edit-chapter/${chapterId}`);
    },
    goToQuizManagement(subjectId, chapterId) {
      this.$router.push(`/admin/subject/${subjectId}/chapter/${chapterId}/quizzes`);
    }
  },
  

  mounted() {
    this.fetchSubjects();
  },

  template: `
    <div>
      <!-- Navbar -->
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
          <a class="navbar-brand" href="#">Admin Dashboard</a>
          <div class="navbar-nav">
            <router-link to="/admin/summary" class="nav-link">Summary</router-link>
            <router-link to="/logout" class="nav-link">Logout</router-link>
          </div>
        </div>
      </nav>

      <!-- Content -->
      <div class="container mt-4">
        <h2>Subjects & Chapters</h2>

        <!-- Error Message -->
        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

        <!-- Add Subject Button -->
        <button class="btn btn-success mb-3" @click="goToAddSubject">Add Subject</button>

        <!-- Subjects List -->
        <div v-for="subject in subjects" :key="subject.id" class="card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5>{{ subject.name }}</h5>
            <div>
              <button class="btn btn-primary btn-sm me-2" @click="goToEditSubject(subject.id)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="deleteSubject(subject.id)">Delete</button>
              <button class="btn btn-success btn-sm" @click="goToAddChapter(subject.id)">Add Chapter</button>
              
            </div>
          </div>
          <div class="card-body">
            <p>{{ subject.description }}</p>

            <!-- Chapters Table -->
            <h6>Chapters</h6>
            <table class="table table-sm table-bordered">
              <thead class="thead-light">
                <tr>
                  <th>Name</th>
                  
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="chapter in chapters[subject.id]" :key="chapter.id">
                  <td>{{ chapter.name }}</td>
                  
                  <td>
                    <button class="btn btn-warning btn-sm" @click="goToEditChapter(subject.id, chapter.id)">Edit</button>
                    <button class="btn btn-danger btn-sm" @click="deleteChapter(subject.id, chapter.id)">Delete</button>
                    <button class="btn btn-info btn-sm" @click="goToQuizManagement(subject.id, chapter.id)">Manage Quiz</button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="!chapters[subject.id] || chapters[subject.id].length === 0" class="text-muted">
              No chapters available.
            </div>
          </div>
        </div>

        <div v-if="subjects.length === 0" class="text-center text-muted">No subjects found.</div>
      </div>
    </div>
  `,
};
