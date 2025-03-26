import router from "./utils/router.js";

const app = new Vue({
    el: "#app",
    template: `
        <div> 
            <Navbar v-if="isAuthenticated" :userRole="userRole"></Navbar>
            <router-view></router-view>
            <button v-if="isAuthenticated" @click="fetchData" class="btn btn-primary mt-3">Fetch Data</button>
        </div>
    `,

    router,

    data() {
        return {
            isAuthenticated: false,
            userRole: null,
            fetchedData: null
        };
    },

    methods: {
        login(role, token) {
            this.isAuthenticated = true;
            this.userRole = role;
            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem("userRole", role);
            localStorage.setItem("token", token);
        },

        logout() {
            this.isAuthenticated = false;
            this.userRole = null;
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("userRole");
            localStorage.removeItem("token");
            this.$router.push("/");
        },

        checkAuthentication() {
            this.isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
            this.userRole = localStorage.getItem("userRole");
        },

        fetchData() {
            fetch("https://api.example.com/data")  // Replace with your API endpoint
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then(data => {
                    this.fetchedData = data;
                    console.log("Fetched Data:", data);
                })
                .catch(error => {
                    console.error("Error fetching data:", error);
                });
        }
    },

    mounted() {
        this.checkAuthentication();
        if (!this.isAuthenticated && this.$route.path !== "/") {
            this.$router.replace("/");
        }
    }
});
