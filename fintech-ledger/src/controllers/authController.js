import { registerUser, loginUser } from "../services/authService.js";

export const handleSignup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = await registerUser(username, email, password);
    return res
      .status(201)
      .json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.status(500).json({ error: "Server error during signup" });
  }
};

export const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const data = await loginUser(email, password);
    return res.status(200).json({ message: "Login successful", data });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Server error during login" });
  }
};
