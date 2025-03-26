export default {
  name: "UserLogin",
  data() {
    return { email: '', password: '' };
  },
  methods: {
    async login() {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/user/login', {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            email: this.email, 
            password: this.password 
          })
        });

        if (!response.ok) {
          throw new Error("Invalid credentials.");
        }

        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        this.$router.push('/user/dashboard');

      } catch (error) {
        alert("Invalid credentials. Try again.");
        console.error("Login error:", error);
      }
    }
  },
  template: `
    <div class="container mt-5">
      <h2 class="text-center">User Login</h2>
      <div class="card p-4">
        <form @submit.prevent="login">
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" v-model="email" class="form-control" required>
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" v-model="password" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-primary w-100">Login</button>
        </form>
      </div>
    </div>
  `
};
