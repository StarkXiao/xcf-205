@echo off
chcp 65001
echo ==========================================
echo   智慧城市事件管理系统 - 一键启动脚本
echo ==========================================

echo.
echo 📦 安装后端依赖...
cd backend
call npm install
cd ..

echo.
echo 📦 安装前端依赖...
cd frontend
call npm install
cd ..

echo.
echo 🌱 初始化数据...
cd backend
call npm run seed
cd ..

echo.
echo ✅ 依赖安装和数据初始化完成！
echo.
echo 📖 请按以下步骤启动项目：
echo.
echo 1. 启动后端服务：
echo    cd backend & npm run start:dev
echo.
echo 2. 启动前端服务（新开一个终端）：
echo    cd frontend & npm run dev
echo.
echo 3. 访问系统：
echo    前端地址: http://localhost:3000
echo    后端地址: http://localhost:3001
echo.
echo 👤 默认账号：admin / 123456
echo.
pause
