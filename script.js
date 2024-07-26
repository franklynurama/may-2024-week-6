// scripts.js
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const username = formData.get("username");
      const password = formData.get("password");
      const email = formData.get("email");
      const full_name = formData.get("full_name");
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password, email, full_name }),
        });
        if (response.ok) {
          alert("Registration successful");
        } else {
          alert("Registration failed");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    });
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const username = formData.get("username");
      const password = formData.get("password");
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });
        if (response.ok) {
          alert("Login successful");
        } else {
          alert("Invalid username or password");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    });
  }
});
