import "dotenv/config";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import Relationship from "../models/relationshipModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendMail } from "../utils/mail.js";
import { tokenize, normalizeQuery } from "../utils/searchHelper.js";

const deleteInfo = (user) => {
  const userSafe = user.toObject();
  delete userSafe.password;
  delete userSafe.refreshToken;
  delete userSafe.otp; // nếu không muốn trả về OTP
  delete userSafe.otpExpiresAt; // nếu không muốn trả về thời gian hết hạn OTP
  delete userSafe.isVerifiedForgot;
  delete userSafe.isVerified;
  delete userSafe.__v; // nếu muốn
  return userSafe;
};

//📌 Hàm tạo JWT
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  });
};

const getRelationshipStatuses = async (currentUserId, userId) => {
  const relationships = await Relationship.find({
    from: currentUserId,
    to: userId,
    type: "follow",
  }).lean();
  if (!relationships || relationships.length === 0) {
    return {
      isMe: false,
      following: false,
    };
  }
  return {
    isMe: false,
    following: true,
  };
};

// 📌 Xử lý logic đăng nhập
const loginUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return {
      status: 401,
      data: { message: "Sai username hoặc password" },
    };
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken; // Lưu refresh token vào user
  await user.save(); // Lưu refresh token vào DB

  // Chuyển sang object thường và loại bỏ các trường nhạy cảm
  const userSafe = user.toObject();
  delete userSafe.password;
  delete userSafe.refreshToken;
  delete userSafe.otp; // nếu không muốn trả về OTP
  delete userSafe.otpExpiresAt; // nếu không muốn trả về thời gian hết hạn OTP
  delete userSafe.isVerifiedForgot;
  delete userSafe.isVerified;
  delete userSafe.__v; // nếu muốn

  return {
    status: 200,
    refreshToken,
    data: {
      message: "Đăng nhập thành công",
      accessToken,
      user: userSafe, // Trả về user đã loại bỏ password và refreshToken
    },
  };
};

const refreshToken = async (token) => {
  if (!token) {
    return {
      status: 401,
      data: { message: "Không có token" },
    };
  }
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return {
        status: 403,
        data: { message: "Token không hợp lệ" },
      };
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken; // Cập nhật refresh token mới
    await user.save(); // Lưu refresh token mới vào DB

    const userSafe = deleteInfo(user); // Loại bỏ thông tin nhạy cảm

    return {
      status: 200,
      refreshToken: newRefreshToken,
      data: {
        accessToken: newAccessToken,
        user: userSafe, // Trả về user đã loại bỏ password và refreshToken
      },
    };
  } catch (error) {
    return {
      status: 403,
      data: { message: "Token không hợp lệ" },
    };
  }
};
// 📌 Lấy thông tin người dùng theo ID
const getUserProfile = async (userId) => {
  const userDoc = await User.findById(userId).select("-password");
  if (!userDoc) {
    return {
      status: 404,
      data: { message: "Không tìm thấy người dùng" },
    };
  }

  //const user = userDoc.toObject();

  // Lấy số lượng bài viết, follower, following

  const postCount = await Post.countDocuments({ author: userDoc._id });
  // followerCount: số người theo dõi user này
  // const followerCount = Array.isArray(user.friends.follower)
  //   ? user.friends.follower.length
  //   : user.friends.follower
  //   ? user.friends.follower
  //   : 0;
  const followerCount = await Relationship.countDocuments({
    to: userDoc._id,
    type: "follow",
  });
  // followingCount: số người user này đang theo dõi
  const followingCount = await Relationship.countDocuments({
    from: userDoc._id,
    type: "follow",
  });
  // const followingCount = Array.isArray(user.friends.following)
  //   ? user.friends.following.length
  //   : user.friends.following
  //   ? user.friends.following
  //   : 0;

  // Gắn trực tiếp vào user
  //user.postCount = postCount;
  //user.followerCount = followerCount;
  //user.followingCount = followingCount;

  const user = deleteInfo(userDoc); // Loại bỏ thông tin nhạy cảm

  return {
    status: 200,
    data: {
      message: "Lấy thông tin người dùng thành công",
      user: {
        ...user,
        postCount,
        followerCount,
        followingCount,
      },
    },
  };
};

// 📌 Xử lý logic đăng ký
const registerUser = async (body) => {
  const { username, firstName, lastName, birthDate, gender, email, password } =
    body;

  console.log("Body: ", body);

  // Kiểm tra dữ liệu đầu vào
  if (!username || !email || !password) {
    return {
      status: 400,
      data: { message: "Vui lòng cung cấp đầy đủ thông tin" },
    };
  }

  // Kiểm tra username hoặc email đã tồn tại
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return {
      status: 400,
      data: { message: "Username hoặc email đã tồn tại" },
    };
  }

  // Tạo OTP và mã hóa mật khẩu
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedPassword = await bcrypt.hash(password, 10);

  // Tạo user mới với đầy đủ thông tin
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    otp,
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    profile: {
      firstname: firstName,
      lastname: lastName,
      gender: gender || "",
      birthday: birthDate ? new Date(birthDate) : null,
      bio: "",
      avatar: "",
    },
    friends: {
      pending: [],
      accepted: [],
      blocked: [],
    },
  });

  await newUser.save();
  await sendMail(email, "Xác minh tài khoản", `Mã OTP của bạn là: ${otp}`);

  return {
    status: 200,
    data: {
      message:
        "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
    },
  };
};
// 📌 Xác thực OTP
const verifyOTP = async (email, otp) => {
  if (!email || !otp) {
    return {
      status: 400,
      data: { message: "Vui lòng cung cấp email và mã OTP" },
    };
  }
  const user = await User.findOne({ email });
  if (!user) {
    return {
      status: 404,
      data: { message: "Không tìm thấy người dùng" },
    };
  }
  if (user.isVerified) {
    return {
      status: 400,
      data: { message: "Tài khoản đã được xác thực" },
    };
  }
  if (user.otp !== otp) {
    return {
      status: 400,
      data: { message: "Mã OTP không đúng" },
    };
  }
  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    return {
      status: 400,
      data: { message: "Mã OTP đã hết hạn" },
    };
  }
  user.isVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();
  return {
    status: 200,
    data: { message: "Xác thực OTP thành công" },
  };
};

// 📌 Quên mật khẩu
const forgotPassword = async (email) => {
  if (!email) {
    return {
      status: 400,
      data: { message: "Vui lòng nhập email" },
    };
  }
  const user = await User.findOne({ email });
  if (!user) {
    return {
      status: 404,
      data: { message: "Không tìm thấy người dùng" },
    };
  }
  // Tạo OTP mới cho quên mật khẩu
  const otp = crypto.randomInt(100000, 999999).toString();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await sendMail(
    email,
    "Quên mật khẩu",
    `Mã OTP đặt lại mật khẩu của bạn là: ${otp}`
  );
  return {
    status: 200,
    data: { message: "Mã OTP đã được gửi tới email của bạn." },
  };
};

// 📌 Xác thực OTP quên mật khẩu
const forgotPasswordOTP = async (email, otp) => {
  if (!email || !otp) {
    return {
      status: 400,
      data: { message: "Vui lòng cung cấp email và mã OTP" },
    };
  }
  const user = await User.findOne({ email });
  if (!user) {
    return {
      status: 404,
      data: { message: "Không tìm thấy người dùng" },
    };
  }
  if (user.otp !== otp) {
    return {
      status: 400,
      data: { message: "Mã OTP không đúng" },
    };
  }
  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    return {
      status: 400,
      data: { message: "Mã OTP đã hết hạn" },
    };
  }
  // Đánh dấu đã xác thực OTP cho quên mật khẩu
  user.isVerifiedForgot = true;
  await user.save();
  return {
    status: 200,
    data: {
      message: "Xác thực OTP thành công. Bạn có thể đặt lại mật khẩu mới.",
    },
  };
};

// 📌 Đặt lại mật khẩu
const resetPassword = async (email, newPassword) => {
  if (!email || !newPassword) {
    return {
      status: 400,
      data: { message: "Vui lòng nhập email và mật khẩu mới" },
    };
  }
  const user = await User.findOne({ email });
  if (!user) {
    return {
      status: 404,
      data: { message: "Không tìm thấy người dùng" },
    };
  }
  // Kiểm tra đã xác thực OTP quên mật khẩu chưa
  if (!user.isVerifiedForgot) {
    return {
      status: 400,
      data: { message: "Bạn chưa xác thực OTP quên mật khẩu" },
    };
  }
  user.password = await bcrypt.hash(newPassword, 10);
  user.isVerifiedForgot = false;
  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();
  return {
    status: 200,
    data: { message: "Đổi mật khẩu thành công." },
  };
};

// 📌 Cập nhật thông tin profile người dùng
const updateUserProfile = async (user, body, file) => {
  try {
    const { username, lastname, firstname, birthday, bio } = body;
    // Đảm bảo user.profile tồn tại
    // Chỉ kiểm tra trùng username khi thực sự đổi sang username khác
    const me = await User.findById(user.id);
    let canUpdate = true;
    if (
      typeof username === "string" &&
      typeof me.username === "string" &&
      username.trim() &&
      username.trim() !== me.username
    ) {
      const existingUser = await User.findOne({
        username: username.trim(),
        _id: { $ne: user._id },
      });
      if (existingUser) {
        canUpdate = false;
        return {
          status: 400,
          data: {
            success: false,
            message: "Tên người dùng đã tồn tại, vui lòng chọn tên khác!",
          },
        };
      }
    }
    if (!canUpdate) return;
    // Chỉ cập nhật avatar nếu có file mới, nếu không thì không gửi trường avatar vào update
    const updateFields = {
      username,
      "profile.lastname": lastname,
      "profile.firstname": firstname,
      "profile.birthday": birthday,
      "profile.bio": bio,
    };
    if (file && file.path) {
      updateFields["profile.avatar"] = file.path;
    }

    await User.findByIdAndUpdate(user.id, updateFields, { new: true });

    // Lấy lại user mới nhất sau khi cập nhật
    const updatedUser = await User.findById(user.id).select("-password");
    // Chuyển sang object thường và loại bỏ các trường nhạy cảm
    const newInfo = deleteInfo(updatedUser);
    return {
      status: 200,
      data: {
        success: true,
        message: "Cập nhật thông tin cá nhân thành công!",
        user: newInfo,
      },
    };
  } catch (err) {
    return {
      status: 500,
      data: {
        success: false,
        message: "Cập nhật thất bại",
        error: err.message,
      },
    };
  }
};

const searchUsers = async (query, currentUserId) => {
  const keywords = tokenize(query);
  const normalized = normalizeQuery(query);

  // Điều kiện tìm kiếm (username hoặc họ tên)
  const regexConditions = keywords.flatMap((kw) => [
    { username: { $regex: kw, $options: "i" } },
    { "profile.firstname": { $regex: kw, $options: "i" } },
    { "profile.lastname": { $regex: kw, $options: "i" } },
  ]);

  // Lấy dữ liệu thô
  //   let users = await User.find(
  //     { $or: regexConditions },
  //     {
  //       _id: 1,
  //       username: 1,
  //       "profile.firstname": 1,
  //       "profile.lastname": 1,
  //       "profile.avatar": 1
  //     }
  //   )
  //     .limit(20)
  //     .lean();
  let users = await User.find(
    {
      $or: regexConditions,
      _id: { $ne: currentUserId }, // Loại bỏ chính mình
    },
    {
      _id: 1,
      username: 1,
      "profile.firstname": 1,
      "profile.lastname": 1,
      "profile.avatar": 1,
    }
  )
    .limit(20)
    .lean();

  // Gộp firstname và lastname thành fullName
  users = users.map((u) => ({
    _id: u._id,
    username: u.username,
    fullName: `${u.profile?.lastname || ""} ${
      u.profile?.firstname || ""
    }`.trim(),
    avatar: u.profile?.avatar || "",
  }));

  // Sắp xếp ưu tiên username khớp trước
  users.sort((a, b) => {
    const aUser = a.username.toLowerCase();
    const bUser = b.username.toLowerCase();
    const aFull = a.fullName.toLowerCase();
    const bFull = b.fullName.toLowerCase();

    if (aUser === normalized && bUser !== normalized) return -1;
    if (bUser === normalized && aUser !== normalized) return 1;

    if (aUser.includes(normalized) && !bUser.includes(normalized)) return -1;
    if (bUser.includes(normalized) && !aUser.includes(normalized)) return 1;

    if (aFull.includes(normalized) && !bFull.includes(normalized)) return -1;
    if (bFull.includes(normalized) && !aFull.includes(normalized)) return 1;

    return 0;
  });

  return {
    status: 200,
    data: {
      message: "Tìm kiếm người dùng thành công",
      users,
    },
  };
};

const getUserProfileByUsername = async (username, currentUserId) => {
  try {
    // Tìm user theo username
    const userDoc = await User.findOne({ username }).select("-password");
    if (!userDoc) {
      return {
        status: 404,
        data: { message: "Không tìm thấy người dùng" },
      };
    }

    //const user = userDoc.toObject();

    // Lấy số lượng bài viết
    const postCount = await Post.countDocuments({ author: userDoc._id });

    // followerCount: số người theo dõi user này
    // const followerCount = Array.isArray(user.friends?.follower)
    //   ? user.friends.follower.length
    //   : user.friends?.follower || 0;

    // // followingCount: số người user này đang theo dõi
    // const followingCount = Array.isArray(user.friends?.following)
    //   ? user.friends.following.length
    //   : user.friends?.following || 0;
    const followerCount = await Relationship.countDocuments({
      to: userDoc._id,
      type: "follow",
    });
    // followingCount: số người user này đang theo dõi
    const followingCount = await Relationship.countDocuments({
      from: userDoc._id,
      type: "follow",
    });

    // Gắn trực tiếp vào user
    //user.postCount = postCount;
    //user.followerCount = followerCount;
    //user.followingCount = followingCount;

    const userSafe = deleteInfo(userDoc); // Loại bỏ thông tin nhạy cảm
    if (currentUserId === String(userDoc._id)) {
      // Nếu là chính mình, không cần gọi API lấy relationship status
      return {
        status: 200,
        data: {
          message: "Lấy thông tin người dùng thành công",
          user: {
            ...userSafe,
            postCount,
            followerCount,
            followingCount,
            relationship_status: {
              isMe: true,
              following: false,
            },
          }, // Trả về user đã loại bỏ password và refreshToken
        },
      };
    }
    // Lấy relationship status giữa currentUserId và userDoc._id
    const relationship_status = await getRelationshipStatuses(
      currentUserId,
      userDoc._id
    );
    return {
      status: 200,
      data: {
        message: "Lấy thông tin người dùng thành công",
        user: {
          ...userSafe,
          postCount,
          followerCount,
          followingCount,
          relationship_status,
        }, // Trả về user đã loại bỏ password và refreshToken
      },
    };
  } catch (err) {
    return {
      status: 500,
      data: { message: "Lỗi server", error: err.message },
    };
  }
};

const logout = async (refreshToken) => {
  try {
    // Xác thực refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userId = decoded.id;
    // Xóa refresh token của user
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    return {
      status: 200,
      data: { message: "Đăng xuất thành công" },
    };
  } catch (err) {
    console.error("Lỗi đăng xuất:", err);
    return {
      status: 500,
      data: { message: "Đã xảy ra lỗi, vui lòng thử lại." },
    };
  }
};
export {
  loginUser,
  getUserProfile,
  registerUser,
  verifyOTP,
  forgotPassword,
  forgotPasswordOTP,
  resetPassword,
  updateUserProfile,
  searchUsers,
  getUserProfileByUsername,
  refreshToken,
  logout,
};
