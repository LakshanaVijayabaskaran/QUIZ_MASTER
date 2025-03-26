export default {
  name: "Home",
  template: `
    <div class="container mt-5 text-center">
      <h1>Welcome to Quiz Master</h1>
      <p>Your ultimate platform for quizzes and knowledge testing!</p>
      <div class="mt-4">
        <button class="btn btn-primary me-2" @click="$router.push('/user/login')">Login as User</button>
        <button class="btn btn-secondary me-2" @click="$router.push('/admin/login')">Login as Admin</button>
        <button class="btn btn-success" @click="$router.push('/register')">Sign Up</button>
      </div>
    </div>
  `
};

