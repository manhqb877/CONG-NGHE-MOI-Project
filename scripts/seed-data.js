const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://doankhoe0809_db_user:Tdk08092004@cluster0.t4usdr8.mongodb.net/?appName=Cluster0';
const DB_NAME = 'OTT_Education';

const AVATARS = [
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=2',
    'https://i.pravatar.cc/150?img=3',
    'https://i.pravatar.cc/150?img=5',
    'https://i.pravatar.cc/150?img=7',
    'https://i.pravatar.cc/150?img=8',
    'https://i.pravatar.cc/150?img=9',
    'https://i.pravatar.cc/150?img=10',
];

const GROUP_AVATARS = [
    'https://i.pravatar.cc/150?img=20',
    'https://i.pravatar.cc/150?img=21',
];

async function seed() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(DB_NAME);

    // --- Collections ---
    const usersCol = db.collection('users');
    const friendsCol = db.collection('list_friend');
    const messagesCol = db.collection('messages');
    const groupsCol = db.collection('groups');

    // --- 1. Clean existing seed data (keep admin) ---
    const seedUsernames = ['anhnguyen', 'minhpham', 'thuyle', 'hoangtran', 'linhngo', 'ducle', 'testuser123', 'testuser999'];
    await usersCol.deleteMany({ username: { $in: seedUsernames } });
    console.log('🧹 Cleaned old seed users');

    // --- 2. Hash password ---
    const hashedPassword = await bcrypt.hash('Test1234', 10);
    const now = new Date();

    // --- 3. Create users ---
    const users = [
        {
            _id: new ObjectId(),
            username: 'anhnguyen',
            password: hashedPassword,
            email: 'anh.nguyen@gmail.com',
            phone: '0901234567',
            firstName: 'Anh',
            lastName: 'Nguyễn',
            birthday: new Date('1999-03-15'),
            gender: 'FEMALE',
            status: 'ACTIVE',
            avatar: AVATARS[0],
            friends: [],
            blocks: [],
            role: 'USER',
            activeStatus: 'ONLINE',
            createdAt: now,
            updateAt: now,
        },
        {
            _id: new ObjectId(),
            username: 'minhpham',
            password: hashedPassword,
            email: 'minh.pham@gmail.com',
            phone: '0912345678',
            firstName: 'Minh',
            lastName: 'Phạm',
            birthday: new Date('2000-07-20'),
            gender: 'MALE',
            status: 'ACTIVE',
            avatar: AVATARS[1],
            friends: [],
            blocks: [],
            role: 'USER',
            activeStatus: 'ONLINE',
            createdAt: now,
            updateAt: now,
        },
        {
            _id: new ObjectId(),
            username: 'thuyle',
            password: hashedPassword,
            email: 'thuy.le@gmail.com',
            phone: '0923456789',
            firstName: 'Thúy',
            lastName: 'Lê',
            birthday: new Date('2001-11-05'),
            gender: 'FEMALE',
            status: 'ACTIVE',
            avatar: AVATARS[2],
            friends: [],
            blocks: [],
            role: 'USER',
            activeStatus: 'AWAY',
            createdAt: now,
            updateAt: now,
        },
        {
            _id: new ObjectId(),
            username: 'hoangtran',
            password: hashedPassword,
            email: 'hoang.tran@gmail.com',
            phone: '0934567890',
            firstName: 'Hoàng',
            lastName: 'Trần',
            birthday: new Date('1998-05-10'),
            gender: 'MALE',
            status: 'ACTIVE',
            avatar: AVATARS[3],
            friends: [],
            blocks: [],
            role: 'USER',
            activeStatus: 'OFFLINE',
            createdAt: now,
            updateAt: now,
        },
        {
            _id: new ObjectId(),
            username: 'linhngo',
            password: hashedPassword,
            email: 'linh.ngo@gmail.com',
            phone: '0945678901',
            firstName: 'Linh',
            lastName: 'Ngô',
            birthday: new Date('2001-01-25'),
            gender: 'FEMALE',
            status: 'ACTIVE',
            avatar: AVATARS[4],
            friends: [],
            blocks: [],
            role: 'USER',
            activeStatus: 'ONLINE',
            createdAt: now,
            updateAt: now,
        },
        {
            _id: new ObjectId(),
            username: 'ducle',
            password: hashedPassword,
            email: 'duc.le@gmail.com',
            phone: '0956789012',
            firstName: 'Đức',
            lastName: 'Lê',
            birthday: new Date('2000-09-18'),
            gender: 'MALE',
            status: 'ACTIVE',
            avatar: AVATARS[5],
            friends: [],
            blocks: [],
            role: 'USER',
            activeStatus: 'ONLINE',
            createdAt: now,
            updateAt: now,
        },
    ];

    await usersCol.insertMany(users);
    console.log(`✅ Created ${users.length} users`);

    const [anh, minh, thuy, hoang, linh, duc] = users;

    // --- 4. Friend pairs (ACCEPTED) ---
    // anh <-> minh, anh <-> thuy, anh <-> hoang, anh <-> linh
    // minh <-> thuy, minh <-> hoang, minh <-> duc
    // thuy <-> linh, hoang <-> duc
    const friendPairs = [
        [anh, minh], [anh, thuy], [anh, hoang], [anh, linh],
        [minh, thuy], [minh, hoang], [minh, duc],
        [thuy, linh], [hoang, duc],
    ];

    const friendDocs = friendPairs.map(([a, b]) => ({
        _id: new ObjectId(),
        senderId: a._id.toString(),
        receiverId: b._id.toString(),
        status: 'ACCEPTED',
        createdAt: now,
        updatedAt: now,
    }));
    await friendsCol.insertMany(friendDocs);
    console.log(`✅ Created ${friendDocs.length} friend relationships`);

    // Update friends list in users
    for (const [a, b] of friendPairs) {
        await usersCol.updateOne({ _id: a._id }, { $addToSet: { friends: b._id.toString() } });
        await usersCol.updateOne({ _id: b._id }, { $addToSet: { friends: a._id.toString() } });
    }
    console.log('✅ Updated friends lists in users');

    // --- 5. Messages between pairs ---
    const messageDocs = [];

    function makeMessages(sender, receiver, convos) {
        const msgs = [];
        let baseTime = new Date(now - convos.length * 60000 * 5);
        for (const text of convos) {
            const swap = msgs.length % 2 !== 0;
            const s = swap ? receiver : sender;
            const r = swap ? sender : receiver;
            const t = new Date(baseTime.getTime() + msgs.length * 5 * 60000 + Math.random() * 60000);
            msgs.push({
                _id: new ObjectId(),
                senderId: s._id.toString(),
                receiverId: r._id.toString(),
                groupId: null,
                content: text,
                type: 'TEXT',
                recalled: false,
                isRead: true,
                status: 'READ',
                createdAt: t,
                updatedAt: t,
            });
        }
        return msgs;
    }

    // anh <-> minh
    messageDocs.push(...makeMessages(anh, minh, [
        'Ê Minh, tối nay có rảnh không?',
        'Rảnh thì sao? 😄',
        'Mình đang cần người review code phần authentication nè',
        'Oke, gửi link repo đây cho tao coi',
        'https://github.com/edu-ott/backend - nhánh feature/auth nhé',
        'Tao xem rồi, lỗi ở chỗ JWT expiry đó, chỉnh lại thành 7 ngày đi',
        'Oke cảm ơn mày nhiều lắm 🙏',
        'Không có gì, tối ghé cafe học chung không?',
        'Được đó! 7h tối nhé?',
        'Hẹn gặp 🎉',
    ]));

    // anh <-> thuy
    messageDocs.push(...makeMessages(anh, thuy, [
        'Thúy ơi, bài tập nhóm hôm nay mình làm phần nào vậy?',
        'Mình làm slide, bạn làm báo cáo nhé!',
        'Okay, deadline lúc mấy giờ?',
        '11h đêm nay, nhanh lên nha',
        'Oke đang làm rồi đây, khoảng 9h xong',
        'Tốt quá, cảm ơn bạn nhiều nhé 😊',
        'Nộp xong rồi!',
        '🎉 Hay quá, cảm ơn bạn!',
    ]));

    // anh <-> hoang
    messageDocs.push(...makeMessages(anh, hoang, [
        'Hoàng ơi, mày thi giữa kỳ được mấy điểm?',
        'Tao được 8.5, còn mày?',
        '9.0 hehe 😎',
        'Đỉnh thật đó! Chỉ tao học với',
        'Tối qua tao học từ 9h đến 2h sáng đó',
        'Trời ơi, khỏe thật 😅',
        'Quen rồi, thi xong mình đi ăn lẩu không?',
        'OK nhé! Mày rủ Minh với Linh luôn đi',
        'Oke để tao nhắn 🍲',
    ]));

    // minh <-> thuy
    messageDocs.push(...makeMessages(minh, thuy, [
        'Thúy ơi cho tao mượn note môn CSDL với',
        'Tao chụp ảnh gửi cho nha',
        'Cảm ơn bạn nhiều lắm!',
        'Không có gì, học tốt nhé!',
        'Bạn giỏi môn này lắm, tao cứ không hiểu bài join',
        'Tao giải thích cho nha, INNER JOIN là...',
        'À ra vậy, giờ tao hiểu rồi, cảm ơn bạn nhiều 😄',
        'Có gì không hiểu cứ hỏi tao nha!',
    ]));

    // anh <-> linh
    messageDocs.push(...makeMessages(anh, linh, [
        'Linh ơi! Hôm nay mình có ăn trưa cùng không?',
        'Có chứ! Đi đâu vậy?',
        'Quán bún bò gần trường, ngon lắm',
        'Oke! 12h mình gặp nhau ở cổng trường nhé',
        '✅ Đúng 12h nha, mình đến rồi!',
        'Tao đang đi tới rồi, 2 phút nữa',
        'Bún bò ngon thật sự đó 😋',
        'Đúng rồi! Lần sau mình rủ thêm bạn đến nha',
    ]));

    // minh <-> duc
    messageDocs.push(...makeMessages(minh, duc, [
        'Đức ơi mày có học môn AI không?',
        'Có, sao vậy?',
        'Tao không hiểu phần neural network, mày giải thích được không?',
        'Được thôi, chiều nay tao rảnh, mày qua phòng tao',
        'Okay! 3h tao qua',
        'Nhớ mang laptop nha, tao có code mẫu cho mày chạy thử',
        'Oke! Cảm ơn mày 🙏',
    ]));

    await messagesCol.insertMany(messageDocs);
    console.log(`✅ Created ${messageDocs.length} direct messages`);

    // --- 6. Create Groups ---
    const group1Id = new ObjectId();
    const group2Id = new ObjectId();

    const groups = [
        {
            _id: group1Id,
            name: '🎓 Nhóm Đồ Án Môn Học',
            createId: anh._id.toString(),
            memberIds: [anh._id.toString(), minh._id.toString(), thuy._id.toString(), hoang._id.toString()],
            roles: {
                [anh._id.toString()]: 'OWNER',
                [minh._id.toString()]: 'ADMIN',
                [thuy._id.toString()]: 'MEMBER',
                [hoang._id.toString()]: 'MEMBER',
            },
            avatarGroup: GROUP_AVATARS[0],
            isActive: true,
            createAt: now,
            updateAt: now,
        },
        {
            _id: group2Id,
            name: '🍕 Hội Ăn Chơi Cuối Tuần',
            createId: minh._id.toString(),
            memberIds: [minh._id.toString(), anh._id.toString(), linh._id.toString(), duc._id.toString(), hoang._id.toString()],
            roles: {
                [minh._id.toString()]: 'OWNER',
                [anh._id.toString()]: 'ADMIN',
                [linh._id.toString()]: 'MEMBER',
                [duc._id.toString()]: 'MEMBER',
                [hoang._id.toString()]: 'MEMBER',
            },
            avatarGroup: GROUP_AVATARS[1],
            isActive: true,
            createAt: now,
            updateAt: now,
        },
    ];

    await groupsCol.insertMany(groups);
    console.log('✅ Created 2 group chats');

    // --- 7. Group messages ---
    const groupMsgDocs = [];

    function makeGroupMessages(groupId, members, conversations) {
        const msgs = [];
        let baseTime = new Date(now - conversations.length * 3 * 60000);
        conversations.forEach((item, i) => {
            const sender = members[i % members.length];
            const t = new Date(baseTime.getTime() + i * 3 * 60000 + Math.random() * 30000);
            msgs.push({
                _id: new ObjectId(),
                senderId: sender._id.toString(),
                receiverId: null,
                groupId: groupId.toString(),
                content: item,
                type: 'TEXT',
                recalled: false,
                isRead: true,
                status: 'READ',
                createdAt: t,
                updatedAt: t,
            });
        });
        return msgs;
    }

    // Group 1 - Đồ án
    groupMsgDocs.push(...makeGroupMessages(group1Id, [anh, minh, thuy, hoang], [
        'Mọi người ơi, mình bắt đầu phân công công việc nhé!',
        'Tao làm phần backend - API authentication',
        'Mình làm frontend - giao diện chat',
        'Tao làm database design và seeding',
        'Tốt lắm! Deadline cuối tuần nhé mọi người',
        'Backend tao xong rồi, push lên repo rồi đó',
        'Frontend đang làm, khoảng 70% rồi',
        'Database xong, có sample data rồi nhé',
        'Mọi người test thử đi, báo lỗi cho tao biết',
        'Phần login lỗi nhỏ, tao fix rồi, pull code về nhé',
        'Oke kéo về rồi, chạy ngon 🎉',
        'Tuyệt! Demo ngày mai mình sẽ thành công thôi',
        'Cố lên mọi người! 💪',
        'Nộp rồi! Mình làm tốt lắm, chúc mừng team 🏆',
    ]));

    // Group 2 - Ăn chơi
    groupMsgDocs.push(...makeGroupMessages(group2Id, [minh, anh, linh, duc, hoang], [
        'Cuối tuần này đi đâu mọi người?',
        'Đi Vũng Tàu đi! Lâu rồi chưa đi biển 🏖️',
        'Xa quá, đi quán cafe mới trên đường Nguyễn Huệ đi',
        'Quán nào vậy? Ngon không?',
        'View đẹp lắm, có WiFi, cafe ngon, dessert ngon',
        'Địa chỉ đâu bạn ơi?',
        '27 Nguyễn Huệ, quận 1 nha, tên là "The Rooftop"',
        'Oke đồng ý đi! Mấy giờ?',
        'Sáng 9h nha, sáng sớm còn chỗ ngồi',
        'Oke 9h! Ai không đến phạt mua cà phê cho cả nhóm 😂',
        'HAHAHA đồng ý 😄',
        'Mình sẽ có mặt đúng giờ!',
        'Đến rồi! Đẹp thật sự, view 360 độ 🌟',
        'Hội tụ đủ mặt rồi! Chụp hình kỉ niệm nào 📸',
        'Vui quá mọi ơi! Lần sau đi tiếp nha 🎉',
    ]));

    await messagesCol.insertMany(groupMsgDocs);
    console.log(`✅ Created ${groupMsgDocs.length} group messages`);

    // --- Done ---
    console.log('\n🎊 Seed data completed!');
    console.log('='.repeat(50));
    console.log('📋 Summary:');
    console.log(`   👥 Users: ${users.length} (password: Test1234)`);
    console.log(`   🤝 Friend pairs: ${friendDocs.length}`);
    console.log(`   💬 Direct messages: ${messageDocs.length}`);
    console.log(`   👥 Groups: ${groups.length}`);
    console.log(`   📨 Group messages: ${groupMsgDocs.length}`);
    console.log('='.repeat(50));
    console.log('\n📝 Test accounts:');
    users.forEach(u => {
        console.log(`   username: ${u.username} | password: Test1234`);
    });

    await client.close();
}

seed().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
