export default {
    name: "AddChapter",
    data() {
      return { 
        subjectId: null, 
        name: "", 
        errorMessage: "" 
      };
    },
  
    methods: {
      async submitChapter() {
        try {
          const response = await fetch("http://127.0.0.1:5000/api/admin/chapter", {
            method: "POST",
            credentials: "include", // 👈 Include session cookies
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ subject_id: this.subjectId, name: this.name }),
          });
  
          if (response.status === 401) {
            alert("Session expired. Please log in again.");
            this.$router.push("/admin/login");
            return;
          }
  
          if (!response.ok) throw new Error("Failed to add chapter");
  
          alert("Chapter added successfully!");
          this.$router.push('/admin/dashboard');
        } catch (error) {
          console.error("Error adding chapter:", error);
          this.errorMessage = error.message;
        }
      },
    },
  
    created() {
      this.subjectId = this.$route.params.subjectId;
    },
  
    template: `
      <div class="container mt-4">
        <h2>Add Chapter</h2>
  
        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
  
        <form @submit.prevent="submitChapter">
          <div class="mb-3">
            <label class="form-label">Chapter Name</label>
            <input type="text" v-model="name" class="form-control" required>
          </div>
  
          <button type="submit" class="btn btn-success">Add Chapter</button>
          <router-link to="/admin/dashboard" class="btn btn-secondary ms-2">Cancel</router-link>
        </form>
      </div>
    `,
  };
  