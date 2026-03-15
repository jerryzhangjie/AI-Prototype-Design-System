<template>
  <div class="login-container">
    <div class="login-box">
      <h1>HR系统登录</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-item">
          <input type="text" v-model="username" placeholder="用户名" />
        </div>
        <div class="form-item">
          <input type="password" v-model="password" placeholder="密码" />
        </div>
        <button type="submit" class="login-btn">登录</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    handleLogin() {
      alert(`${this.username} 登录成功!`)
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  width: 350px;
}
h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}
.form-item {
  margin-bottom: 20px;
}
input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  box-sizing: border-box;
}
.login-btn {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}
.login-btn:hover {
  background: #5568d3;
}
</style>
