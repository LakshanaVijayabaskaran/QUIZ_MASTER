export default {
  name: "Register",
  data() {
    return { full_name: '', email: '', password: '' };
  },
  methods: {
    async register() {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/register', {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            full_name: this.full_name, 
            email: this.email, 
            password: this.password 
          })
        });

        if (!response.ok) {
          throw new Error("Registration failed.");
        }

        alert("Registration successful! You can now log in.");
        this.$router.push('/user/login');

      } catch (error) {
        alert("Error in registration.");
        console.error("Registration error:", error);
      }
    }
  },
  template: `
    <div class="container mt-5">
      <h2 class="text-center">Sign Up</h2>
      <div class="card p-4">
        <form @submit.prevent="register">
          <div class="mb-3">
            <label for="full_name" class="form-label">Full Name</label>
            <input type="text" v-model="full_name" class="form-control" required>
          </div>
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" v-model="email" class="form-control" required>
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" v-model="password" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-success w-100">Register</button>
        </form>
      </div>
    </div>
  `
};

