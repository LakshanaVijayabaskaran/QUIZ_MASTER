export default {
    name: "EditChapter",
    data() {
      return { 
        chapterId: null, 
        name: "", 
        errorMessage: "" 
      };
    },
  
    methods: {
      async fetchChapterDetails() {
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/admin/chapter/${this.chapterId}`, {
            method: "GET",
            credentials: "include", // 👈 Include session cookies
          });
  
          if (response.status === 401) {
            alert("Session expired. Please log in again.");
            this.$router.push("/admin/login");
            return;
          }
  
          if (!response.ok) throw new Error("Failed to fetch chapter details");
  
          const data = await response.json();
          this.name = data.name;
        } catch (error) {
          console.error("Error fetching chapter:", error);
          this.errorMessage = error.message;
        }
      },
  
      async updateChapter() {
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/admin/chapter/${this.chapterId}`, {
            method: "PUT",
            credentials: "include", // 👈 Include session cookies
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: this.name }),
          });
  
          if (response.status === 401) {
            alert("Session expired. Please log in again.");
            this.$router.push("/admin/login");
            return;
          }
  
          if (!response.ok) throw new Error("Failed to update chapter");
  
          alert("Chapter updated successfully!");
          this.$router.push('/admin/dashboard');
        } catch (error) {
          console.error("Error updating chapter:", error);
          this.errorMessage = error.message;
        }
      },
    },
  
    created() {
      this.chapterId = this.$route.params.chapterId;
      this.fetchChapterDetails();
    },
  
    template: `
      <div class="container mt-4">
        <h2>Edit Chapter</h2>
  
        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
  
        <form @submit.prevent="updateChapter">
          <div class="mb-3">
            <label class="form-label">Chapter Name</label>
            <input type="text" v-model="name" class="form-control" required>
          </div>
  
          <button type="submit" class="btn btn-primary">Update Chapter</button>
          <router-link to="/admin/dashboard" class="btn btn-secondary ms-2">Cancel</router-link>
        </form>
      </div>
    `,
  };
  