// src/components/common/VietnamClock.tsx

import { useState, useEffect } from 'react';

const VietnamClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // 1. Thiết lập interval để cập nhật thời gian mỗi giây
    const timerId = setInterval(() => {
      setTime(new Date()); 
    }, 1000);

    // 2. Dọn dẹp (cleanup) interval khi component bị gỡ bỏ
    return () => clearInterval(timerId);
  }, []); // [] đảm bảo useEffect chỉ chạy 1 lần khi mount

  // 3. Định dạng thời gian theo múi giờ Việt Nam (UTC+7)
  const formattedTime = time.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', // Múi giờ Việt Nam
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // 4. Định dạng ngày tháng
  const formattedDate = time.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col items-end">
      <div className="text-2xl font-bold text-primary">
        {formattedTime}
      </div>
      <div className="text-sm text-muted-foreground mt-0.5">
        {formattedDate} (Giờ Việt Nam)
      </div>
    </div>
  );
};

export default VietnamClock;