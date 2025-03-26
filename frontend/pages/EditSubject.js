export default {
  name: "EditSubject",
  data() {
    return { id: null, name: '', description: '' };
  },
  methods: {
    async fetchSubject() {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/admin/subject/${this.id}`, {
          method: "GET",
          credentials: "include",  // 👈 Include session cookies
        });

        if (response.status === 401) {
          alert("Session expired. Please log in again.");
          this.$router.push("/admin/login");
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch subject details");
        
        const data = await response.json();
        this.name = data.name;
        this.description = data.description;
      } catch (error) {
        console.error("Error fetching subject:", error);
      }
    },

    async updateSubject() {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/admin/edit-subject/${this.id}`, {
          method: "PUT",
          credentials: "include", // 👈 Include session cookies
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: this.name, description: this.description }),
        });

        if (response.status === 401) {
          alert("Session expired. Please log in again.");
          this.$router.push("/admin/login");
          return;
        }

        if (!response.ok) throw new Error("Failed to update subject");

        alert("Subject updated successfully!");
        this.$router.push("/admin/dashboard");
      } catch (error) {
        console.error("Error updating subject:", error);
      }
    }
  },
  
  created() {
    this.id = this.$route.params.id;
    this.fetchSubject();
  },
  
  template: `
    <div class="container mt-4">
      <h2>Edit Subject</h2>
      <form @submit.prevent="updateSubject">
        <div class="mb-3">
          <label class="form-label">Subject Name</label>
          <input type="text" v-model="name" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Description</label>
          <textarea v-model="description" class="form-control"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Update Subject</button>
      </form>
    </div>
  `
};
