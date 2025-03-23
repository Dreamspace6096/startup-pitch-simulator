# GitHub仓库同步指南

## 1. 安装Git
从[Git官网](https://git-scm.com/downloads)下载并安装Git

## 2. 配置Git
打开命令提示符或PowerShell，输入以下命令：
```bash
git config --global user.name "您的GitHub用户名"
git config --global user.email "您的GitHub邮箱"
```

## 3. 初始化本地仓库
在项目目录中执行：
```bash
cd G:\Cursor_folder\startup-pitch-simulator
git init
```

## 4. 添加远程仓库
```bash
git remote add origin https://github.com/Dreamspace6096/startup-pitch-simulator.git
```

## 5. 添加文件到仓库
```bash
git add .
```

## 6. 提交更改
```bash
git commit -m "初始提交 - 创业路演模拟器应用"
```

## 7. 推送到GitHub
```bash
git push -u origin master
```
或者如果您使用main作为主分支：
```bash
git push -u origin main
```

## 8. 身份验证
在推送过程中，您需要输入GitHub的用户名和密码（或个人访问令牌）

## 注意事项

### 如果远程仓库已有内容
如果远程仓库已经有内容，您可能需要先拉取：
```bash
git pull origin master --allow-unrelated-histories
```
然后解决可能的冲突，再推送。

### 个人访问令牌
如果您使用双因素认证，需要创建个人访问令牌：
1. 访问GitHub的Settings > Developer settings > Personal access tokens
2. 生成新令牌，授予适当的权限
3. 使用令牌代替密码进行身份验证

### .gitignore文件
我们已创建一个.gitignore文件，确保敏感信息和临时文件不会被上传。 