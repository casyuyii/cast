"use client";

import React, { useState } from "react";
import {
  ShareAltOutlined,
  DownloadOutlined,
  FileTextOutlined,
  QuestionOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu } from "antd";
import { useRouter, usePathname } from "next/navigation";

const { Header } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    label: "Text",
    key: "text",
    icon: <FileTextOutlined />,
    children: [
      {
        label: "Share",
        key: "/text/share",
        icon: <ShareAltOutlined />,
      },
      {
        label: "Get",
        key: "/text/get",
        icon: <DownloadOutlined />,
      },
    ],
  },
  {
    label: "Test",
    key: "/test",
    icon: <QuestionOutlined />,
  },
];

const TopMenuBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [current, setCurrent] = useState(pathname || "text");

  const onClick: MenuProps["onClick"] = (e) => {
    setCurrent(e.key);

    // Navigate to the route if it's a valid path
    if (e.key.startsWith("/")) {
      router.push(e.key);
    }
  };

  return (
    <Layout>
      <Header
        style={{
          backgroundColor: "white",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Menu
          onClick={onClick}
          selectedKeys={[current]}
          mode="horizontal"
          items={items}
        />
      </Header>
    </Layout>
  );
};

export default TopMenuBar;
