import { connect, model, Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://localhost:27017/smart-city';

const roleSchema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: String,
  permissions: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  realName: { type: String, required: true },
  phone: String,
  roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
  isActive: { type: Boolean, default: true },
  department: String,
  avatar: String,
}, { timestamps: true });

const eventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'pending' },
  images: { type: [String], default: [] },
  location: String,
  address: String,
  lng: Number,
  lat: Number,
  reporterId: { type: Schema.Types.ObjectId, ref: 'User' },
  reporterName: String,
  reporterPhone: String,
  handlerId: { type: Schema.Types.ObjectId, ref: 'User' },
  handlerName: String,
  source: String,
  remark: String,
}, { timestamps: true });

const workOrderSchema = new Schema({
  orderNo: { type: String, required: true, unique: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  title: { type: String, required: true },
  description: String,
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'pending' },
  assignerId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignerName: String,
  handlerId: { type: Schema.Types.ObjectId, ref: 'User' },
  handlerName: String,
  department: String,
  deadline: Date,
  handleResult: String,
  handleImages: { type: [String], default: [] },
  handleTime: Date,
  verifyTime: Date,
  verifyResult: String,
  verifyRemark: String,
  logs: [{ type: Schema.Types.ObjectId, ref: 'WorkOrderLog' }],
}, { timestamps: true });

const workOrderLogSchema = new Schema({
  workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  action: { type: String, required: true },
  description: String,
  operatorId: { type: Schema.Types.ObjectId, ref: 'User' },
  operatorName: String,
  from: { type: Schema.Types.Mixed, default: {} },
  to: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const notificationSchema = new Schema({
  type: { type: String, required: true, enum: ['system', 'todo', 'reminder', 'approval'] },
  title: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, default: 'unread', enum: ['unread', 'read'] },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  readAt: Date,
  relatedId: String,
  relatedType: String,
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },
  senderName: String,
  priority: { type: String, default: 'medium', enum: ['low', 'medium', 'high'] },
  extra: { type: Object, default: {} },
}, { timestamps: true });

async function seed() {
  console.log('开始初始化数据...');
  
  await connect(MONGODB_URI);
  console.log('数据库连接成功');

  const Role = model('Role', roleSchema);
  const User = model('User', userSchema);
  const Event = model('Event', eventSchema);
  const WorkOrder = model('WorkOrder', workOrderSchema);
  const WorkOrderLog = model('WorkOrderLog', workOrderLogSchema);
  const Notification = model('Notification', notificationSchema);

  await clearData(Role, User, Event, WorkOrder, WorkOrderLog, Notification);
  const roles = await seedRoles(Role);
  const users = await seedUsers(User, roles);
  const events = await seedEvents(Event, users);
  const workOrders = await seedWorkOrders(WorkOrder, WorkOrderLog, events, users);
  const notifications = await seedNotifications(Notification, users, workOrders);
  
  console.log('数据初始化完成！');
  console.log(`- 角色: ${roles.length} 个`);
  console.log(`- 用户: ${users.length} 个`);
  console.log(`- 事件: ${events.length} 个`);
  console.log(`- 工单: ${workOrders.length} 个`);
  console.log(`- 通知: ${notifications.length} 条`);
  
  process.exit(0);
}

async function clearData(Role: any, User: any, Event: any, WorkOrder: any, WorkOrderLog: any, Notification: any) {
  console.log('清空现有数据...');
  await Role.deleteMany({});
  await User.deleteMany({});
  await Event.deleteMany({});
  await WorkOrder.deleteMany({});
  await WorkOrderLog.deleteMany({});
  await Notification.deleteMany({});
  console.log('数据清空完成');
}

async function seedRoles(Role: any) {
  console.log('创建角色数据...');
  
  const rolesData = [
    {
      name: '超级管理员',
      code: 'admin',
      description: '系统超级管理员，拥有所有权限',
      permissions: ['*'],
    },
    {
      name: '调度员',
      code: 'dispatcher',
      description: '负责事件受理和工单分派',
      permissions: ['event:view', 'event:create', 'event:update', 'workorder:view', 'workorder:create', 'workorder:assign'],
    },
    {
      name: '处理人员',
      code: 'handler',
      description: '负责工单的处理执行',
      permissions: ['workorder:view', 'workorder:process', 'workorder:complete'],
    },
    {
      name: '核查人员',
      code: 'verifier',
      description: '负责工单处理结果的核查',
      permissions: ['workorder:view', 'workorder:verify'],
    },
    {
      name: '市民',
      code: 'citizen',
      description: '普通市民，可以上报事件',
      permissions: ['event:create', 'event:view'],
    },
  ];

  const roles = await Role.create(rolesData);
  console.log(`创建了 ${roles.length} 个角色`);
  return roles;
}

async function seedUsers(User: any, roles: any[]) {
  console.log('创建用户数据...');
  
  const roleMap: Record<string, any> = {};
  roles.forEach(role => {
    roleMap[role.code] = role._id;
  });

  const hashedPassword = await bcrypt.hash('123456', 10);

  const usersData = [
    {
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      phone: '13800000000',
      roleId: roleMap.admin,
      department: '信息中心',
    },
    {
      username: 'dispatcher1',
      password: hashedPassword,
      realName: '张调度',
      phone: '13800000001',
      roleId: roleMap.dispatcher,
      department: '指挥中心',
    },
    {
      username: 'dispatcher2',
      password: hashedPassword,
      realName: '李调度',
      phone: '13800000002',
      roleId: roleMap.dispatcher,
      department: '指挥中心',
    },
    {
      username: 'handler1',
      password: hashedPassword,
      realName: '王师傅',
      phone: '13800000003',
      roleId: roleMap.handler,
      department: '市政维修部',
    },
    {
      username: 'handler2',
      password: hashedPassword,
      realName: '赵师傅',
      phone: '13800000004',
      roleId: roleMap.handler,
      department: '环卫部门',
    },
    {
      username: 'handler3',
      password: hashedPassword,
      realName: '孙师傅',
      phone: '13800000005',
      roleId: roleMap.handler,
      department: '园林部门',
    },
    {
      username: 'handler4',
      password: hashedPassword,
      realName: '周师傅',
      phone: '13800000006',
      roleId: roleMap.handler,
      department: '水务部门',
    },
    {
      username: 'verifier1',
      password: hashedPassword,
      realName: '陈核查',
      phone: '13800000007',
      roleId: roleMap.verifier,
      department: '质检部',
    },
    {
      username: 'verifier2',
      password: hashedPassword,
      realName: '刘核查',
      phone: '13800000008',
      roleId: roleMap.verifier,
      department: '质检部',
    },
    {
      username: 'citizen1',
      password: hashedPassword,
      realName: '市民张三',
      phone: '13900000001',
      roleId: roleMap.citizen,
    },
    {
      username: 'citizen2',
      password: hashedPassword,
      realName: '市民李四',
      phone: '13900000002',
      roleId: roleMap.citizen,
    },
    {
      username: 'citizen3',
      password: hashedPassword,
      realName: '市民王五',
      phone: '13900000003',
      roleId: roleMap.citizen,
    },
  ];

  const users = await User.create(usersData);
  console.log(`创建了 ${users.length} 个用户`);
  return users;
}

async function seedEvents(Event: any, users: any[]) {
  console.log('创建事件数据...');
  
  const citizenUsers = users.filter((u: any) => u.username.startsWith('citizen'));
  
  const eventsData = [
    {
      title: '中山路与人民路交叉口路面破损',
      description: '路口西南角路面有大面积破损，存在安全隐患，约3平方米大小。',
      category: 'road',
      priority: 'high',
      status: 'processing',
      location: '中山路与人民路交叉口',
      address: '中山路与人民路交叉口西南角',
      lng: 121.4737,
      lat: 31.2304,
      reporterName: citizenUsers[0].realName,
      reporterPhone: citizenUsers[0].phone,
      reporterId: citizenUsers[0]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: '解放路垃圾桶满溢',
      description: '解放中路沿线多个垃圾桶已满，垃圾堆积在桶外，影响市容。',
      category: 'sanitation',
      priority: 'medium',
      status: 'resolved',
      location: '解放中路',
      address: '解放中路123号附近',
      lng: 121.4837,
      lat: 31.2404,
      reporterName: citizenUsers[1].realName,
      reporterPhone: citizenUsers[1].phone,
      reporterId: citizenUsers[1]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: '人民公园树木倒伏',
      description: '由于昨晚大风，人民公园内一棵大树倒伏，挡住了部分道路。',
      category: 'greening',
      priority: 'urgent',
      status: 'processing',
      location: '人民公园',
      address: '人民公园东门附近',
      lng: 121.4637,
      lat: 31.2204,
      reporterName: citizenUsers[2].realName,
      reporterPhone: citizenUsers[2].phone,
      reporterId: citizenUsers[2]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: '文化广场路灯损坏',
      description: '文化广场北侧路灯有两盏不亮，晚上散步不安全。',
      category: 'facility',
      priority: 'medium',
      status: 'pending',
      location: '文化广场',
      address: '文化广场北侧',
      lng: 121.4537,
      lat: 31.2504,
      reporterName: citizenUsers[0].realName,
      reporterPhone: citizenUsers[0].phone,
      reporterId: citizenUsers[0]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      title: '滨江工地夜间施工噪音扰民',
      description: '滨江路一工地夜间10点后仍在施工，噪音很大影响附近居民休息。',
      category: 'noise',
      priority: 'high',
      status: 'processing',
      location: '滨江路',
      address: '滨江路88号工地',
      lng: 121.4937,
      lat: 31.2104,
      reporterName: citizenUsers[1].realName,
      reporterPhone: citizenUsers[1].phone,
      reporterId: citizenUsers[1]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      title: '新华街供水管爆裂',
      description: '新华街与建设路交叉口供水管爆裂，水柱喷出很高，请尽快处理。',
      category: 'water',
      priority: 'urgent',
      status: 'resolved',
      location: '新华街与建设路交叉口',
      address: '新华街与建设路交叉口西北角',
      lng: 121.4437,
      lat: 31.2604,
      reporterName: citizenUsers[2].realName,
      reporterPhone: citizenUsers[2].phone,
      reporterId: citizenUsers[2]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: '东城区配电箱门敞开',
      description: '东城区一路边配电箱门没有关上，有安全隐患，希望尽快处理。',
      category: 'electricity',
      priority: 'high',
      status: 'pending',
      location: '东城区',
      address: '东城区朝阳路56号旁',
      lng: 121.5037,
      lat: 31.2454,
      reporterName: citizenUsers[0].realName,
      reporterPhone: citizenUsers[0].phone,
      reporterId: citizenUsers[0]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      title: '燃气管道有异味',
      description: '老城区古巷附近闻到燃气异味，怀疑有燃气泄漏，请尽快派人检查。',
      category: 'gas',
      priority: 'urgent',
      status: 'processing',
      location: '老城区古巷',
      address: '老城区古巷32号附近',
      lng: 121.4687,
      lat: 31.2384,
      reporterName: citizenUsers[1].realName,
      reporterPhone: citizenUsers[1].phone,
      reporterId: citizenUsers[1]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      title: '南湖公园健身器材损坏',
      description: '南湖公园内部分健身器材损坏，无法使用，建议维修。',
      category: 'facility',
      priority: 'low',
      status: 'closed',
      location: '南湖公园',
      address: '南湖公园健身区',
      lng: 121.4337,
      lat: 31.2154,
      reporterName: citizenUsers[2].realName,
      reporterPhone: citizenUsers[2].phone,
      reporterId: citizenUsers[2]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      title: '城西路段积水严重',
      description: '昨晚大雨后，城西工业区路段积水严重，影响车辆通行。',
      category: 'water',
      priority: 'high',
      status: 'resolved',
      location: '城西工业区',
      address: '城西工业区科技路',
      lng: 121.4237,
      lat: 31.2554,
      reporterName: citizenUsers[0].realName,
      reporterPhone: citizenUsers[0].phone,
      reporterId: citizenUsers[0]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: '绿化带垃圾堆积',
      description: '北环路沿线绿化带内有很多白色垃圾，影响环境美观。',
      category: 'sanitation',
      priority: 'low',
      status: 'pending',
      location: '北环路',
      address: '北环路东段绿化带',
      lng: 121.4787,
      lat: 31.2704,
      reporterName: citizenUsers[1].realName,
      reporterPhone: citizenUsers[1].phone,
      reporterId: citizenUsers[1]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
    {
      title: '井盖松动有异响',
      description: '和平路与解放路交叉口井盖松动，车辆经过会发出很大响声。',
      category: 'road',
      priority: 'medium',
      status: 'processing',
      location: '和平路与解放路交叉口',
      address: '和平路与解放路交叉口',
      lng: 121.4887,
      lat: 31.2284,
      reporterName: citizenUsers[2].realName,
      reporterPhone: citizenUsers[2].phone,
      reporterId: citizenUsers[2]._id,
      source: '市民上报',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ];

  const events = await Event.create(eventsData);
  console.log(`创建了 ${events.length} 个事件`);
  return events;
}

async function seedWorkOrders(WorkOrder: any, WorkOrderLog: any, events: any[], users: any[]) {
  console.log('创建工单数据...');
  
  const dispatcherUsers = users.filter((u: any) => u.username.startsWith('dispatcher'));
  const handlerUsers = users.filter((u: any) => u.username.startsWith('handler'));
  const verifierUsers = users.filter((u: any) => u.username.startsWith('verifier'));

  const workOrdersData: any[] = [];

  const order1Events = events.filter((e: any) => e.status === 'processing' && e.category === 'road');
  if (order1Events.length > 0) {
    const event = order1Events[0];
    workOrdersData.push({
      orderNo: generateOrderNo(),
      eventId: event._id,
      title: event.title,
      description: event.description,
      priority: 'high',
      status: 'processing',
      assignerId: dispatcherUsers[0]._id,
      assignerName: dispatcherUsers[0].realName,
      handlerId: handlerUsers[0]._id,
      handlerName: handlerUsers[0].realName,
      department: handlerUsers[0].department,
      createdAt: new Date(event.createdAt.getTime() + 30 * 60 * 1000),
    });
  }

  const order2Events = events.filter((e: any) => e.status === 'resolved' && e.category === 'sanitation');
  if (order2Events.length > 0) {
    const event = order2Events[0];
    workOrdersData.push({
      orderNo: generateOrderNo(),
      eventId: event._id,
      title: event.title,
      description: event.description,
      priority: 'medium',
      status: 'verified',
      assignerId: dispatcherUsers[0]._id,
      assignerName: dispatcherUsers[0].realName,
      handlerId: handlerUsers[1]._id,
      handlerName: handlerUsers[1].realName,
      department: handlerUsers[1].department,
      handleResult: '已安排环卫工人清理完毕，现场已恢复整洁。',
      handleTime: new Date(event.createdAt.getTime() + 4 * 60 * 60 * 1000),
      verifyTime: new Date(event.createdAt.getTime() + 6 * 60 * 60 * 1000),
      verifyResult: 'pass',
      verifyRemark: '现场检查合格，处理及时。',
      createdAt: new Date(event.createdAt.getTime() + 20 * 60 * 1000),
    });
  }

  const order3Events = events.filter((e: any) => e.status === 'processing' && e.category === 'greening');
  if (order3Events.length > 0) {
    const event = order3Events[0];
    workOrdersData.push({
      orderNo: generateOrderNo(),
      eventId: event._id,
      title: event.title,
      description: event.description,
      priority: 'urgent',
      status: 'processing',
      assignerId: dispatcherUsers[1]._id,
      assignerName: dispatcherUsers[1].realName,
      handlerId: handlerUsers[2]._id,
      handlerName: handlerUsers[2].realName,
      department: handlerUsers[2].department,
      createdAt: new Date(event.createdAt.getTime() + 15 * 60 * 1000),
    });
  }

  const order4Events = events.filter((e: any) => e.status === 'processing' && e.category === 'noise');
  if (order4Events.length > 0) {
    const event = order4Events[0];
    workOrdersData.push({
      orderNo: generateOrderNo(),
      eventId: event._id,
      title: event.title,
      description: event.description,
      priority: 'high',
      status: 'assigned',
      assignerId: dispatcherUsers[0]._id,
      assignerName: dispatcherUsers[0].realName,
      handlerId: handlerUsers[0]._id,
      handlerName: handlerUsers[0].realName,
      department: handlerUsers[0].department,
      createdAt: new Date(event.createdAt.getTime() + 45 * 60 * 1000),
    });
  }

  const order5Events = events.filter((e: any) => e.status === 'resolved' && e.category === 'water');
  if (order5Events.length > 0) {
    const event = order5Events[0];
    workOrdersData.push({
      orderNo: generateOrderNo(),
      eventId: event._id,
      title: event.title,
      description: event.description,
      priority: 'urgent',
      status: 'verified',
      assignerId: dispatcherUsers[1]._id,
      assignerName: dispatcherUsers[1].realName,
      handlerId: handlerUsers[3]._id,
      handlerName: handlerUsers[3].realName,
      department: handlerUsers[3].department,
      handleResult: '已更换破损管道，恢复正常供水，现场已清理。',
      handleTime: new Date(event.createdAt.getTime() + 2 * 60 * 60 * 1000),
      verifyTime: new Date(event.createdAt.getTime() + 3 * 60 * 60 * 1000),
      verifyResult: 'pass',
      verifyRemark: '处理迅速，质量合格。',
      createdAt: new Date(event.createdAt.getTime() + 10 * 60 * 1000),
    });
  }

  const order6Events = events.filter((e: any) => e.status === 'processing' && e.category === 'gas');
  if (order6Events.length > 0) {
    const event = order6Events[0];
    workOrdersData.push({
      orderNo: generateOrderNo(),
      eventId: event._id,
      title: event.title,
      description: event.description,
      priority: 'urgent',
      status: 'processing',
      assignerId: dispatcherUsers[0]._id,
      assignerName: dispatcherUsers[0].realName,
      handlerId: handlerUsers[0]._id,
      handlerName: handlerUsers[0].realName,
      department: '燃气公司',
      createdAt: new Date(event.createdAt.getTime() + 5 * 60 * 1000),
    });
  }

  const order7Events = events.filter((e: any) => e.status === 'closed');
  if (order7Events.length > 0) {
    const event = order7Events[0];
    workOrdersData.push({
      orderNo: generateOrderNo(),
      eventId: event._id,
      title: event.title,
      description: event.description,
      priority: 'low',
      status: 'closed',
      assignerId: dispatcherUsers[1]._id,
      assignerName: dispatcherUsers[1].realName,
      handlerId: handlerUsers[2]._id,
      handlerName: handlerUsers[2].realName,
      department: handlerUsers[2].department,
      handleResult: '已安排维修，但因器材老旧需整体更换，已上报采购计划。',
      handleTime: new Date(event.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000),
      verifyTime: new Date(event.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000),
      verifyResult: 'pass',
      verifyRemark: '情况属实，同意纳入更新计划。',
      createdAt: new Date(event.createdAt.getTime() + 1 * 24 * 60 * 60 * 1000),
    });
  }

  const order8Events = events.filter((e: any) => e.status === 'resolved' && e.category !== 'sanitation' && e.category !== 'water');
  if (order8Events.length > 0) {
    const event = order8Events[0];
    workOrdersData.push({
      orderNo: generateOrderNo(),
      eventId: event._id,
      title: event.title,
      description: event.description,
      priority: 'high',
      status: 'completed',
      assignerId: dispatcherUsers[0]._id,
      assignerName: dispatcherUsers[0].realName,
      handlerId: handlerUsers[3]._id,
      handlerName: handlerUsers[3].realName,
      department: handlerUsers[3].department,
      handleResult: '已疏通排水管道，积水已全部排出。',
      handleTime: new Date(event.createdAt.getTime() + 5 * 60 * 60 * 1000),
      createdAt: new Date(event.createdAt.getTime() + 30 * 60 * 1000),
    });
  }

  const workOrders = await WorkOrder.create(workOrdersData);
  console.log(`创建了 ${workOrders.length} 个工单`);

  for (const wo of workOrders) {
    const logs: any[] = [];
    
    logs.push({
      workOrderId: wo._id,
      action: '创建工单',
      description: '工单已创建',
      operatorId: wo.assignerId,
      operatorName: wo.assignerName,
      createdAt: wo.createdAt,
    });

    if (wo.status !== 'pending') {
      logs.push({
        workOrderId: wo._id,
        action: '派单',
        description: `工单已指派给 ${wo.handlerName}`,
        operatorId: wo.assignerId,
        operatorName: wo.assignerName,
        createdAt: new Date(wo.createdAt.getTime() + 10 * 60 * 1000),
      });
    }

    if (wo.status === 'processing' || wo.status === 'completed' || wo.status === 'verified' || wo.status === 'closed') {
      logs.push({
        workOrderId: wo._id,
        action: '开始处理',
        description: '工作人员开始处理工单',
        operatorId: wo.handlerId,
        operatorName: wo.handlerName,
        createdAt: new Date(wo.createdAt.getTime() + 30 * 60 * 1000),
      });
    }

    if (wo.handleResult && (wo.status === 'completed' || wo.status === 'verified' || wo.status === 'closed')) {
      logs.push({
        workOrderId: wo._id,
        action: '处理完成',
        description: wo.handleResult,
        operatorId: wo.handlerId,
        operatorName: wo.handlerName,
        createdAt: wo.handleTime,
      });
    }

    if (wo.verifyResult && (wo.status === 'verified' || wo.status === 'closed')) {
      logs.push({
        workOrderId: wo._id,
        action: '核查' + (wo.verifyResult === 'pass' ? '通过' : '不通过'),
        description: wo.verifyRemark || '',
        operatorId: verifierUsers[0]._id,
        operatorName: verifierUsers[0].realName,
        createdAt: wo.verifyTime,
      });
    }

    if (wo.status === 'closed') {
      logs.push({
        workOrderId: wo._id,
        action: '关闭工单',
        description: '工单已关闭',
        operatorId: dispatcherUsers[0]._id,
        operatorName: dispatcherUsers[0].realName,
        createdAt: new Date((wo.verifyTime || wo.handleTime).getTime() + 24 * 60 * 60 * 1000),
      });
    }

    await WorkOrderLog.create(logs);
  }

  console.log('创建工单日志完成');
  return workOrders;
}

async function seedNotifications(Notification: any, users: any[], workOrders: any[]) {
  console.log('创建通知数据...');
  
  const handlerUsers = users.filter((u: any) => u.username.startsWith('handler'));
  const dispatcherUsers = users.filter((u: any) => u.username.startsWith('dispatcher'));
  const verifierUsers = users.filter((u: any) => u.username.startsWith('verifier'));
  
  const notificationsData: any[] = [];
  
  const processingWorkOrders = workOrders.filter((wo: any) => wo.status === 'processing');
  const assignedWorkOrders = workOrders.filter((wo: any) => wo.status === 'assigned');
  const completedWorkOrders = workOrders.filter((wo: any) => wo.status === 'completed');
  const verifiedWorkOrders = workOrders.filter((wo: any) => wo.status === 'verified');
  
  if (assignedWorkOrders.length > 0) {
    const wo = assignedWorkOrders[0];
    notificationsData.push({
      type: 'todo',
      title: '新工单待处理',
      content: `您有一个新的工单【${wo.orderNo}】需要处理：${wo.title}`,
      status: 'unread',
      userId: wo.handlerId,
      relatedId: wo._id.toString(),
      relatedType: 'workorder',
      senderId: wo.assignerId,
      senderName: wo.assignerName,
      priority: wo.priority === 'urgent' || wo.priority === 'high' ? 'high' : 'medium',
      createdAt: new Date(wo.createdAt.getTime() + 5 * 60 * 1000),
    });
  }
  
  if (processingWorkOrders.length > 0) {
    const wo = processingWorkOrders[0];
    notificationsData.push({
      type: 'reminder',
      title: '工单催办通知',
      content: `工单【${wo.orderNo}】需要尽快处理：${wo.title}`,
      status: 'unread',
      userId: wo.handlerId,
      relatedId: wo._id.toString(),
      relatedType: 'workorder',
      senderId: dispatcherUsers[0]._id,
      senderName: dispatcherUsers[0].realName,
      priority: 'high',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    });
  }
  
  if (completedWorkOrders.length > 0) {
    const wo = completedWorkOrders[0];
    notificationsData.push({
      type: 'approval',
      title: '工单待核查',
      content: `工单【${wo.orderNo}】已处理完成，等待核查：${wo.title}`,
      status: 'unread',
      userId: wo.assignerId,
      relatedId: wo._id.toString(),
      relatedType: 'workorder',
      senderId: wo.handlerId,
      senderName: wo.handlerName,
      priority: 'medium',
      createdAt: wo.handleTime,
    });
  }
  
  if (verifiedWorkOrders.length > 0) {
    const wo = verifiedWorkOrders[0];
    notificationsData.push({
      type: 'approval',
      title: '工单核查通过',
      content: `工单【${wo.orderNo}】核查通过：${wo.title}`,
      status: 'read',
      userId: wo.handlerId,
      relatedId: wo._id.toString(),
      relatedType: 'workorder',
      senderId: verifierUsers[0]._id,
      senderName: verifierUsers[0].realName,
      priority: 'low',
      createdAt: wo.verifyTime,
      readAt: new Date(wo.verifyTime.getTime() + 2 * 60 * 60 * 1000),
    });
  }
  
  notificationsData.push({
    type: 'system',
    title: '欢迎使用智慧城管系统',
    content: '系统已完成升级，新增通知中心功能，您可以及时接收工单提醒、催办通知和审批结果。',
    status: 'unread',
    userId: handlerUsers[0]._id,
    priority: 'medium',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });
  
  notificationsData.push({
    type: 'system',
    title: '系统维护通知',
    content: '本周六凌晨2点至4点将进行系统维护，期间可能无法正常访问，请提前做好工作安排。',
    status: 'unread',
    userId: handlerUsers[0]._id,
    priority: 'low',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });
  
  if (processingWorkOrders.length > 1) {
    const wo = processingWorkOrders[1];
    notificationsData.push({
      type: 'todo',
      title: '新工单待处理',
      content: `您有一个新的工单【${wo.orderNo}】需要处理：${wo.title}`,
      status: 'unread',
      userId: wo.handlerId,
      relatedId: wo._id.toString(),
      relatedType: 'workorder',
      senderId: wo.assignerId,
      senderName: wo.assignerName,
      priority: wo.priority === 'urgent' || wo.priority === 'high' ? 'high' : 'medium',
      createdAt: new Date(wo.createdAt.getTime() + 5 * 60 * 1000),
    });
  }
  
  notificationsData.push({
    type: 'system',
    title: '巡检计划提醒',
    content: '您有本月的巡检任务待完成，请及时查看并按计划执行。',
    status: 'unread',
    userId: handlerUsers[0]._id,
    relatedType: 'inspection_plan',
    priority: 'medium',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  });
  
  const notifications = await Notification.create(notificationsData);
  console.log(`创建了 ${notifications.length} 条通知`);
  return notifications;
}

function generateOrderNo() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WO${dateStr}${random}`;
}

seed().catch(err => {
  console.error('数据初始化失败:', err);
  process.exit(1);
});
