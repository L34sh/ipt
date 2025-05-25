-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 25, 2025 at 05:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gymdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `account`
--

CREATE TABLE `account` (
  `account_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `type` enum('member','clerk','admin') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account`
--

INSERT INTO `account` (`account_id`, `email`, `password`, `type`) VALUES
(1, 'admin@gym.com', '123', 'admin'),
(2, 'member@gym.com', '123', 'member'),
(3, 'clerk@gym.com', '123', 'clerk'),
(4, 'clerk2@gym.com', '123', 'member');

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `admin_id` int(11) NOT NULL,
  `account_id` int(11) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`admin_id`, `account_id`, `username`, `password`) VALUES
(1, 1, 'admin', '123');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `member_id` int(11) DEFAULT NULL,
  `time_in` datetime DEFAULT current_timestamp(),
  `time_out` datetime DEFAULT NULL,
  `status` enum('present','absent','late') DEFAULT 'present'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clerk`
--

CREATE TABLE `clerk` (
  `clerk_id` int(11) NOT NULL,
  `account_id` int(11) DEFAULT NULL,
  `photo` varchar(500) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `date_hired` datetime DEFAULT current_timestamp(),
  `status` enum('active','inactive') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clerk`
--

INSERT INTO `clerk` (`clerk_id`, `account_id`, `photo`, `first_name`, `middle_name`, `last_name`, `email`, `password`, `contact_number`, `date_hired`, `status`) VALUES
(1, 3, 'clerk-1748187995671.jpg', 'John', 'ni', 'Doe', 'clerk@gym.com', '123', '09459688446', '2025-05-23 17:17:47', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `inactive_account`
--

CREATE TABLE `inactive_account` (
  `account_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `type` enum('member','clerk','admin') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `member`
--

CREATE TABLE `member` (
  `member_id` int(11) NOT NULL,
  `account_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `membership_type` varchar(100) DEFAULT NULL,
  `date_registered` datetime DEFAULT current_timestamp(),
  `picture` text DEFAULT NULL,
  `qr_code` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `member`
--

INSERT INTO `member` (`member_id`, `account_id`, `first_name`, `middle_name`, `last_name`, `email`, `password`, `contact_number`, `membership_type`, `date_registered`, `picture`, `qr_code`) VALUES
(1, 2, 'Jane', NULL, 'Doe', 'member@gym.com', '123', '+1987654321', 'standard', '2025-05-23 17:17:47', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `membership_logs`
--

CREATE TABLE `membership_logs` (
  `ml_id` int(11) NOT NULL,
  `member_id` int(11) DEFAULT NULL,
  `membership_type` varchar(255) DEFAULT NULL,
  `date_registered` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `membership_plan`
--

CREATE TABLE `membership_plan` (
  `plan_id` int(11) NOT NULL,
  `plan_name` varchar(255) NOT NULL,
  `plan_description` text DEFAULT NULL,
  `plan_perks` text DEFAULT NULL,
  `plan_duration` varchar(100) DEFAULT NULL,
  `plan_price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `membership_plan`
--

INSERT INTO `membership_plan` (`plan_id`, `plan_name`, `plan_description`, `plan_perks`, `plan_duration`, `plan_price`) VALUES
(2, 'hahaha', 'waits', '[\"hay\",\"po\",\"lemon\"]', '30', 300.00);

-- --------------------------------------------------------

--
-- Table structure for table `payment_method`
--

CREATE TABLE `payment_method` (
  `payment_method_id` int(11) NOT NULL,
  `method_name` enum('cash','gcash','maya') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_description` text DEFAULT NULL,
  `product_category` varchar(100) DEFAULT NULL,
  `product_capacity_size` varchar(100) DEFAULT NULL,
  `product_price` decimal(10,2) NOT NULL,
  `product_quantity` int(11) DEFAULT NULL,
  `product_cost_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `product_name`, `product_description`, `product_category`, `product_capacity_size`, `product_price`, `product_quantity`, `product_cost_price`) VALUES
(1, 'C2', 'Tea Drink', 'Beverage', '200ml', 10.00, 30, 15.00);

-- --------------------------------------------------------

--
-- Table structure for table `receipt`
--

CREATE TABLE `receipt` (
  `receipt_id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `item_type` enum('product','membership') NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `VAT` decimal(5,2) DEFAULT 0.12,
  `payment_method` enum('cash','gcash','maya') NOT NULL,
  `date_time` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `sales_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `product_description` text DEFAULT NULL,
  `product_cost_price` decimal(10,2) DEFAULT NULL,
  `product_price` decimal(10,2) DEFAULT NULL,
  `VAT` decimal(5,2) DEFAULT 0.12,
  `VAT_peso` decimal(10,2) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `income_per_item` decimal(10,2) DEFAULT NULL,
  `total_income` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_logs`
--

CREATE TABLE `sales_logs` (
  `sales_logs_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `product_price` decimal(10,2) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account`
--
ALTER TABLE `account`
  ADD PRIMARY KEY (`account_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `member_id` (`member_id`);

--
-- Indexes for table `clerk`
--
ALTER TABLE `clerk`
  ADD PRIMARY KEY (`clerk_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `inactive_account`
--
ALTER TABLE `inactive_account`
  ADD PRIMARY KEY (`account_id`);

--
-- Indexes for table `member`
--
ALTER TABLE `member`
  ADD PRIMARY KEY (`member_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `membership_logs`
--
ALTER TABLE `membership_logs`
  ADD PRIMARY KEY (`ml_id`),
  ADD KEY `member_id` (`member_id`);

--
-- Indexes for table `membership_plan`
--
ALTER TABLE `membership_plan`
  ADD PRIMARY KEY (`plan_id`),
  ADD UNIQUE KEY `plan_name` (`plan_name`);

--
-- Indexes for table `payment_method`
--
ALTER TABLE `payment_method`
  ADD PRIMARY KEY (`payment_method_id`),
  ADD UNIQUE KEY `method_name` (`method_name`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`product_id`);

--
-- Indexes for table `receipt`
--
ALTER TABLE `receipt`
  ADD PRIMARY KEY (`receipt_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`sales_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `sales_logs`
--
ALTER TABLE `sales_logs`
  ADD PRIMARY KEY (`sales_logs_id`),
  ADD KEY `product_id` (`product_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account`
--
ALTER TABLE `account`
  MODIFY `account_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clerk`
--
ALTER TABLE `clerk`
  MODIFY `clerk_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `member`
--
ALTER TABLE `member`
  MODIFY `member_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `membership_logs`
--
ALTER TABLE `membership_logs`
  MODIFY `ml_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `membership_plan`
--
ALTER TABLE `membership_plan`
  MODIFY `plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payment_method`
--
ALTER TABLE `payment_method`
  MODIFY `payment_method_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `receipt`
--
ALTER TABLE `receipt`
  MODIFY `receipt_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `sales_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_logs`
--
ALTER TABLE `sales_logs`
  MODIFY `sales_logs_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `admin_fk_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_fk_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `clerk`
--
ALTER TABLE `clerk`
  ADD CONSTRAINT `clerk_fk_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `member`
--
ALTER TABLE `member`
  ADD CONSTRAINT `member_fk_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
