export default {
  name: "AdminLogin",
  data() {
    return { email: "", password: "" };
  },
  methods: {
    async login() {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email: this.email, password: this.password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Invalid credentials.");
        }

        // ✅ Store session info securely
        localStorage.setItem("user_id", data.user_id);  // Store user ID
        localStorage.setItem("role", data.role); // Store user role (should be "admin")

        // ✅ Redirect to Admin Dashboard
        if (data.role === "admin") {
          this.$router.push("/admin/dashboard");
        } else {
          throw new Error("Unauthorized access.");
        }

      } catch (error) {
        alert(error.message);
        console.error("Login error:", error);
      }
    }
  },
  template: `
    <div class="container mt-5">
      <h2 class="text-center">Admin Login</h2>
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
