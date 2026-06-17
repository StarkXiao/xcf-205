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

const knowledgeSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, required: true, enum: ['event_classification', 'processing_spec', 'verification_criteria'] },
  content: { type: String, required: true },
  eventCategory: String,
  visibleRoles: [{ type: Schema.Types.ObjectId, ref: 'Role', default: [] }],
  tags: { type: [String], default: [] },
  referenceCount: { type: Number, default: 0 },
  version: { type: String, default: '1.0' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
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
  const Knowledge = model('Knowledge', knowledgeSchema);

  await clearData(Role, User, Event, WorkOrder, WorkOrderLog, Notification, Knowledge);
  const roles = await seedRoles(Role);
  const users = await seedUsers(User, roles);
  const events = await seedEvents(Event, users);
  const workOrders = await seedWorkOrders(WorkOrder, WorkOrderLog, events, users);
  const notifications = await seedNotifications(Notification, users, workOrders);
  const knowledges = await seedKnowledge(Knowledge, roles, users);
  
  console.log('数据初始化完成！');
  console.log(`- 角色: ${roles.length} 个`);
  console.log(`- 用户: ${users.length} 个`);
  console.log(`- 事件: ${events.length} 个`);
  console.log(`- 工单: ${workOrders.length} 个`);
  console.log(`- 通知: ${notifications.length} 条`);
  console.log(`- 知识库: ${knowledges.length} 条`);
  
  process.exit(0);
}

async function clearData(Role: any, User: any, Event: any, WorkOrder: any, WorkOrderLog: any, Notification: any, Knowledge: any) {
  console.log('清空现有数据...');
  await Role.deleteMany({});
  await User.deleteMany({});
  await Event.deleteMany({});
  await WorkOrder.deleteMany({});
  await WorkOrderLog.deleteMany({});
  await Notification.deleteMany({});
  await Knowledge.deleteMany({});
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

async function seedKnowledge(Knowledge: any, roles: any[], users: any[]) {
  console.log('创建知识库数据...');

  const roleMap: Record<string, any> = {};
  roles.forEach(role => {
    roleMap[role.code] = role._id;
  });

  const adminUser = users.find((u: any) => u.username === 'admin');

  const knowledgeData = [
    {
      title: '道路设施损坏事件分类标准',
      type: 'event_classification',
      eventCategory: '城市设施',
      content: `一、道路破损分级标准：
1. 轻微破损（等级：低）
   - 坑洞直径小于30cm
   - 路面裂缝宽度小于2cm
   - 不影响正常通行

2. 中度破损（等级：中）
   - 坑洞直径30cm-100cm
   - 路面裂缝宽度2-5cm
   - 对通行有一定影响

3. 严重破损（等级：高）
   - 坑洞直径大于100cm
   - 路面大面积龟裂、沉陷
   - 严重影响通行或存在安全隐患

4. 紧急情况（等级：紧急）
   - 道路突然塌陷
   - 桥梁结构损坏
   - 需立即封闭交通的情况

二、关联部门：
- 市政工程部门负责道路维修
- 交通管理部门配合交通疏导`,
      tags: ['道路', '破损', '分类标准', '分级'],
      visibleRoles: [],
      referenceCount: 15,
      createdBy: adminUser?._id,
      version: '1.2',
    },
    {
      title: '环境卫生问题分类标准',
      type: 'event_classification',
      eventCategory: '环境卫生',
      content: `一、垃圾问题分类：
1. 生活垃圾堆积
   - 垃圾桶满溢
   - 垃圾乱丢
   - 垃圾清运不及时

2. 建筑垃圾乱倒
   - 装修垃圾随意堆放
   - 渣土乱倒
   - 工程废料未清理

3. 卫生死角
   - 背街小巷积存垃圾
   - 绿化带内垃圾
   - 沟渠漂浮物

二、污染问题分类：
1. 水体污染
2. 空气污染
3. 噪音污染
4. 光污染

三、处理时效要求：
- 垃圾桶满溢：4小时内清运
- 垃圾堆积：8小时内清理
- 建筑垃圾：24小时内清理完毕`,
      tags: ['环卫', '垃圾', '污染', '分类'],
      visibleRoles: [],
      referenceCount: 23,
      createdBy: adminUser?._id,
      version: '1.1',
    },
    {
      title: '园林绿化事件分类标准',
      type: 'event_classification',
      eventCategory: '园林绿化',
      content: `一、树木问题分类：
1. 树木倒伏（紧急）
   - 因台风、暴雨等天气导致树木倒伏
   - 阻断交通或压占房屋、电力设施
   - 需立即处置

2. 树木断枝（高）
   - 大风导致大树枝断裂
   - 悬挂在道路上方
   - 存在砸伤行人车辆风险

3. 树木枯死（中）
   - 树木整体或大部分干枯死亡
   - 存在倒伏隐患
   - 影响景观效果

4. 虫害病害（低）
   - 发现明显病虫害迹象
   - 需园林部门防治处理

二、绿地维护问题：
1. 绿地杂草丛生
2. 绿化设施损坏
3. 行人踩踏造成黄土裸露`,
      tags: ['园林', '绿化', '树木', '倒伏'],
      visibleRoles: [],
      referenceCount: 8,
      createdBy: adminUser?._id,
      version: '1.0',
    },
    {
      title: '道路破损工单处理规范',
      type: 'processing_spec',
      eventCategory: '城市设施',
      content: `【处理流程】
1. 接单确认（30分钟内）
   - 接收工单，核实事件信息
   - 如信息不完整，联系上报人补充
   - 根据分类标准判定破损等级

2. 现场勘查（1小时内出发）
   - 到达现场拍摄照片
   - 测量破损面积、深度
   - 评估是否需要临时交通管制
   - 设立安全警示标志

3. 制定维修方案
   - 轻微破损：当日安排修补
   - 中度破损：3日内完成维修
   - 严重破损：7日内完成大修
   - 紧急情况：立即启动应急抢修

4. 维修实施
   - 施工前发布公告
   - 设置安全围挡
   - 严格按照施工规范作业
   - 现场施工负责人全程监管

5. 竣工验收
   - 维修完成后自检
   - 清理施工现场
   - 恢复交通通行
   - 拍照记录处理结果

6. 归档上报
   - 填写施工记录
   - 上传前后对比照片
   - 提交工单处理结果
   - 通知核查人员验收

【安全注意事项】
- 施工人员必须穿戴安全防护装备
- 道路施工必须设置明显警示标志
- 夜间施工需增设照明设备和警示灯
- 遇恶劣天气应停止户外作业

【质量标准】
- 修补后的路面与原路面高差不超过5mm
- 新铺沥青需压实，无松散、开裂现象
- 混凝土路面需养护期满后方可开放交通`,
      tags: ['市政维修', '道路', '处理流程', '施工规范'],
      visibleRoles: [roleMap.admin, roleMap.dispatcher, roleMap.handler],
      referenceCount: 42,
      createdBy: adminUser?._id,
      version: '2.0',
    },
    {
      title: '垃圾清运作业处理规范',
      type: 'processing_spec',
      eventCategory: '环境卫生',
      content: `【作业标准】
1. 出车前检查
   - 检查车辆状况，确保无故障
   - 确认垃圾桶数量、清运路线
   - 工作人员穿戴统一工作服

2. 收集作业
   - 严格按照规定路线和时间作业
   - 垃圾桶轻拿轻放，避免噪音扰民
   - 垃圾装车后及时盖好车盖
   - 不遗漏、不抛洒

3. 站点清运
   - 垃圾桶内外擦拭干净
   - 桶盖盖好，摆放整齐
   - 站点周边散落垃圾清扫干净
   - 喷洒消毒除臭药剂

4. 运输作业
   - 密闭运输，沿途不洒漏
   - 按规定路线行驶至处理厂
   - 遵守交通规则，文明驾驶

5. 卸载作业
   - 在指定地点倾倒垃圾
   - 车辆卸载后及时清洗
   - 填写清运登记台账

【时效要求】
- 居民区：每日早8:00前完成首次清运
- 商业区：每日早9:00前、晚20:00后清运
- 主次干道：巡回收集，每日不少于3次
- 接到满溢报告后：4小时内到场清运

【人员要求】
- 持健康证上岗，每年体检一次
- 岗前培训合格后方可独立作业
- 遵守各项安全操作规程
- 文明作业，不与市民发生争执`,
      tags: ['环卫', '清运', '作业标准', '时效'],
      visibleRoles: [roleMap.admin, roleMap.dispatcher, roleMap.handler],
      referenceCount: 31,
      createdBy: adminUser?._id,
      version: '1.5',
    },
    {
      title: '树木倒伏应急处置规范',
      type: 'processing_spec',
      eventCategory: '园林绿化',
      content: `【应急响应等级】
一级响应（极端情况）：台风、暴雨红色预警期间
二级响应（严重情况）：单次倒伏树木超过10株
三级响应（一般情况）：零星树木倒伏

【处置流程】
1. 接报响应
   - 接到报告后15分钟内响应
   - 了解倒伏位置、树木大小、是否压占
   - 如涉及电力线、房屋，第一时间通知相关部门
   - 就近调派抢险人员和设备

2. 现场处置
   - 到达现场后先设置警戒线
   - 确认无人员伤亡
   - 判断是否影响交通，必要时联系交警
   - 如压占电力设施，断电后方可作业

3. 抢险作业
   - 小型树木（胸径<20cm）：人工扶正加固
   - 中型树木（胸径20-40cm）：吊车辅助扶正
   - 大型树木（胸径>40cm）：分段切割移除
   - 影响通行的：先清理出通道，后续再彻底处理

4. 后期处理
   - 树木能扶正的：加固支撑、浇透水
   - 无法挽救的：清理运走
   - 清理现场枝叶、泥土
   - 对现场进行消毒

5. 台账记录
   - 记录倒伏位置、数量、树种
   - 拍照存档（处置前后）
   - 统计造成的损失
   - 分析倒伏原因，提出改进措施

【安全防护】
- 作业人员佩戴安全帽、防滑鞋
- 使用油锯等工具需专业培训合格
- 高空作业必须系安全带
- 风雨天气注意高空坠物风险`,
      tags: ['应急', '树木', '抢险', '台风'],
      visibleRoles: [roleMap.admin, roleMap.dispatcher, roleMap.handler],
      referenceCount: 19,
      createdBy: adminUser?._id,
      version: '1.3',
    },
    {
      title: '工单处理结果核查口径',
      type: 'verification_criteria',
      eventCategory: '城市设施',
      content: `【核查方式】
1. 现场核查（必选）
   - 核查人员必须到达事件现场
   - 对照上报信息核实处置情况
   - 拍摄现场照片作为核查依据

2. 资料核查
   - 查阅工单处理记录
   - 检查前后对比照片
   - 核实相关责任人签字

【核查标准】
一、道路维修核查
1. 外观检查
   - 修补区域平整，无明显凹凸
   - 与原路面接缝紧密，无开裂
   - 无残留施工材料和垃圾

2. 尺寸测量
   - 修补面积≥上报破损面积
   - 修补深度符合规范要求
   - 路面高差≤5mm

3. 功能检查
   - 不影响车辆正常通行
   - 雨天无积水现象
   - 无安全隐患

二、合格判定
1. 完全合格：全部符合以上标准
2. 基本合格：存在小瑕疵但不影响使用
3. 不合格：未处理或未达到标准

【核查时限】
- 一般工单：处理完成后24小时内完成核查
- 紧急工单：处理完成后12小时内完成核查
- 重大事件：处理完成后6小时内完成核查

【核查结果处理】
- 合格：工单流转结束，归档保存
- 基本合格：通知处理部门注意改进
- 不合格：退回处理部门重新处置，并记录
- 多次不合格的，纳入绩效考核`,
      tags: ['核查', '验收', '标准', '质量'],
      visibleRoles: [roleMap.admin, roleMap.verifier],
      referenceCount: 28,
      createdBy: adminUser?._id,
      version: '1.4',
    },
    {
      title: '环卫作业质量核查口径',
      type: 'verification_criteria',
      eventCategory: '环境卫生',
      content: `【道路保洁核查标准】
一级道路（主干道）：
- 果皮箱：不满溢、外观整洁，每日清掏不少于2次
- 路面：每平方米污渍面积≤0.01㎡
- 废弃物：每100㎡内数量≤2处
- 巡回保洁时间：不低于16小时

二级道路（次干道）：
- 果皮箱：每日清掏不少于1次
- 路面：每平方米污渍面积≤0.02㎡
- 废弃物：每100㎡内数量≤4处
- 巡回保洁时间：不低于12小时

【垃圾清运核查标准】
1. 清运及时率
   - 计划清运率达到100%
   - 应急清运响应时间≤4小时
   - 无满溢超过24小时的情况

2. 清运质量
   - 垃圾桶清运后复位率100%
   - 站点周边无散落垃圾
   - 无污水滴漏现象
   - 车辆车容车貌整洁

【公共厕所核查标准】
1. 卫生状况
   - 地面无积水、无烟蒂纸屑
   - 蹲位干净，无积粪、尿碱
   - 洗手台、镜面无水渍
   - 室内无明显异味

2. 设施完好
   - 冲水设备正常使用
   - 照明、通风良好
   - 水龙头、门锁无损坏
   - 洗手皂、手纸按要求配备

【园林绿化核查标准】
1. 绿地养护
   - 草坪修剪整齐，杂草率≤5%
   - 绿篱线条流畅，无缺株断垄
   - 花卉开败及时摘除

2. 树木养护
   - 无枯死枝、病虫害枝
   - 树干涂白高度统一
   - 支撑加固规范美观
   - 挂牌信息完整准确

【核查评分方式】
采用百分制：
- 90分以上：优秀
- 80-89分：良好
- 70-79分：合格
- 70分以下：不合格，限期整改`,
      tags: ['核查', '环卫', '保洁', '绿化', '评分'],
      visibleRoles: [roleMap.admin, roleMap.verifier],
      referenceCount: 16,
      createdBy: adminUser?._id,
      version: '1.2',
    },
    {
      title: '事件优先级判定标准',
      type: 'event_classification',
      eventCategory: '其他',
      content: `【优先级等级划分】
一、紧急（Urgent）- 红色
定义：可能造成人员伤亡、重大财产损失或严重社会影响的事件
判定条件（满足任一即可）：
1. 涉及人员伤亡或有人员受困
2. 发生火灾、爆炸、燃气泄漏等危险情况
3. 重要交通干道完全中断
4. 重要公共设施严重损坏
5. 涉及群体性事件或可能引发舆情
响应时效：15分钟内响应，2小时内到场处置

二、高（High）- 橙色
定义：对市民生活造成较大影响，需尽快处理的事件
判定条件（满足任一即可）：
1. 交通主干道部分中断
2. 涉及停水、停电、停气超过2小时
3. 窨井盖缺失、路面大坑洞
4. 大面积垃圾堆积（超过5平方米）
5. 学校、医院、政府机关周边
响应时效：30分钟内响应，4小时内到场处置

三、中（Medium）- 黄色
定义：对市民生活有一定影响，但短期内不会造成严重后果
判定条件（满足任一即可）：
1. 一般道路破损
2. 单个垃圾桶满溢
3. 路灯单盏不亮
4. 绿化小范围损坏
5. 噪音扰民投诉
响应时效：1小时内响应，8小时内到场处置

四、低（Low）- 蓝色
定义：不影响正常生活，可在计划内安排处理
判定条件（满足任一即可）：
1. 健身器材小故障
2. 指示牌轻微污损
3. 绿化日常养护问题
4. 环境卫生一般问题
5. 其他建议类事项
响应时效：当日响应，48小时内处置完毕

【升级机制】
1. 同一地点24小时内重复上报的，提升一级
2. 领导批示或媒体曝光的，提升一级
3. 恶劣天气期间，全部提升一级
4. 节假日期间，全部提升一级`,
      tags: ['优先级', '判定', '响应时效', '升级'],
      visibleRoles: [roleMap.admin, roleMap.dispatcher],
      referenceCount: 55,
      createdBy: adminUser?._id,
      version: '2.1',
    },
    {
      title: '工单分派标准与部门职责',
      type: 'processing_spec',
      eventCategory: '其他',
      content: `【部门职责分工】
1. 市政工程部门
   负责范围：
   - 道路、桥梁、隧道维护
   - 排水、供水设施维修
   - 路灯、照明设施管理
   - 井盖、雨水篦子更换

2. 环境卫生部门
   负责范围：
   - 道路清扫保洁
   - 生活垃圾收集清运
   - 公共厕所管理
   - 垃圾分类指导

3. 园林绿化部门
   负责范围：
   - 公园、绿地养护
   - 行道树、绿化带管理
   - 古树名木保护
   - 病虫害防治

4. 交通管理部门
   负责范围：
   - 交通设施维护（信号灯、标志）
   - 交通疏导方案制定
   - 占道施工审批
   - 停车秩序管理

5. 城市管理执法部门
   负责范围：
   - 违法建设查处
   - 占道经营整治
   - 户外广告管理
   - 噪音污染执法

6. 应急管理部门
   负责范围：
   - 突发事件协调指挥
   - 应急队伍调度
   - 物资储备管理
   - 灾害损失评估

【分派原则】
1. 属地管理原则：按事件发生地所属辖区分派
2. 职责对应原则：按部门职责范围对应分派
3. 首接负责原则：最先接报部门负责协调，不得推诿
4. 联合处置原则：涉及多部门的，指定牵头部门

【跨部门协作流程】
1. 涉及2个及以上部门的事件，报指挥中心确定牵头部门
2. 牵头部门负责制定处置方案，协调配合部门
3. 配合部门按方案要求按时完成任务
4. 处置完成后，牵头部门汇总结果上报

【特殊情况处理】
1. 职责不清的：由指挥中心临时指定牵头部门
2. 紧急事件：先调度就近力量处置，再确认责任部门
3. 重大事件：启动应急预案，由应急指挥部统一调度`,
      tags: ['分派', '职责', '部门', '协作'],
      visibleRoles: [roleMap.admin, roleMap.dispatcher],
      referenceCount: 37,
      createdBy: adminUser?._id,
      version: '1.6',
    },
  ];

  const knowledges = await Knowledge.create(knowledgeData);
  console.log(`创建了 ${knowledges.length} 条知识库数据`);
  return knowledges;
}

seed().catch(err => {
  console.error('数据初始化失败:', err);
  process.exit(1);
});
