export default {
  name: "AddSubject",
  data() {
    return { name: '', description: '' };
  },
  methods: {
    async addSubject() {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/admin/add-subject', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Sends session cookie
          body: JSON.stringify({ 
            name: this.name, 
            description: this.description 
          }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to add subject. Make sure you are logged in as an admin.");
        }
  
        alert("Subject added successfully!");
        this.$router.push('/admin/dashboard');
  
      } catch (error) {
        console.error("Error adding subject:", error);
        alert(error.message);
      }
    }
  }
  ,
  template: `
    <div class="container mt-4">
      <h2>Add Subject</h2>
      <form @submit.prevent="addSubject">
        <div class="mb-3">
          <label class="form-label">Subject Name</label>
          <input type="text" v-model="name" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Description</label>
          <textarea v-model="description" class="form-control"></textarea>
        </div>
        <button type="submit" class="btn btn-success">Add Subject</button>
      </form>
    </div>
  `
};
