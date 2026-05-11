# 通用示例片段 - `PROJECT_KNOWLEDGE_BASE.md`

> 说明：这是**结构示范**，不绑定任何具体业务领域。你把它当作“长什么样、字段怎么填”的参照即可。
> 生成真实 KB 时，内容会被自动替换为你的项目数据。

---

## 1. 项目整体概览（示例）

- **定位**：某业务系统（订单/告警/报表/运维/风控等任意领域）的核心能力集合
- **架构模式**：Maven 多模块 / 微服务 / 单体分层（从构建文件与目录得出结论）
- **模块统计**：聚合入口 X 个、业务模块 Y 个、基础模块 Z 个、构建/部署模块 W 个

---

## 2. 模块业务字典（示例表格）

| 模块名 | 模块类型 | 业务含义 | 核心功能 | 优先级 |
|---|---|---|---|---|
| app-gateway | 聚合入口 | 对外统一入口与路由 | 路由、鉴权、限流、请求编排 | 高 |
| domain-xxx | 业务模块 | 业务能力实现与编排 | 领域规则、业务流程、数据变更 | 高 |
| common-core | 基础模块 | 通用基础能力 | JSON/日期/校验/日志/通用异常等 | 中 |
| build-tools | 构建模块 | 编译、打包、质量门禁 | 插件配置、CI 入口、制品发布 | 中 |

---

## 3. 可复用工具类索引（Util/Helper 全量索引 + 说明）

### 3.1 全量索引字段（示例）

| 类名 | 路径 | 分类 | 功能简介 | 使用场景 | 复用等级 | 依赖复杂度 | 风险等级 |
|---|---|---|---|---|---|---|---|
| DateTimeUtil | `common/utils/DateTimeUtil.java` | DateTime | 时间格式转换/时区处理 | 定时任务、报表统计 | 高 | 低 | 低 |
| JsonUtil | `common/utils/JsonUtil.java` | Convert | JSON 序列化/反序列化封装 | 接口入参/出参、配置解析 | 高 | 低 | 低 |
| HttpClientUtil | `common/net/HttpClientUtil.java` | Network | HTTP 调用与超时重试封装 | 外部依赖调用 | 中 | 中 | 中 |
| FileUtil | `common/io/FileUtil.java` | File | 文件读写与路径工具 | 导入导出、日志落盘 | 中 | 低 | 中 |

### 3.2 高复用 TOP 10（示例，来源必须是“全量索引”筛选结果）

1. DateTimeUtil（时间统一入口）
2. JsonUtil（JSON 统一处理）
3. BeanCopyUtil（DTO/Entity 转换）
4. HttpClientUtil（外部调用封装）
5. FileUtil（文件读写）
6. RetryHelper（通用重试策略）
7. ValidateUtil（参数校验）
8. TraceContextUtil（链路上下文）
9. IdGeneratorUtil（ID/流水号生成）
10. CollectionUtil（集合处理扩展）

---

## 4. 现成流程图/图文资产索引（示例）

| 资源名 | 类型 | 路径 | 相关域 | 流程文字说明（1-3 行） |
|---|---|---|---|---|
| xxx_flow.puml | PUML | `docs/diagram/xxx_flow.puml` | 业务主流程 | 触发 -> 计算 -> 调用 -> 输出结果 |
| xxx_sequence.png | PNG | `docs/diagram/xxx_sequence.png` | 异常/边界 | 正常链路/异常链路的交互说明 |

---

## 4.1 脚本与配置资产索引（示例）

### 4.1.1 Python 脚本

| 文件名 | 类型 | 路径 | 功能简介 | 执行上下文 | 依赖 |
|---|---|---|---|---|---|
| `k8s_pod.py` | Script | `aiops-build/k8s/zabbixScript/k8s_pod.py` | K8s Pod 资源监控采集 | Zabbix 探针调用 | Python 3 + k8s 客户端 |
| `backup.py` | Script | `aiops-build/python_service/backup.py` | 系统配置备份 | 定时任务执行 | Python 3 |

### 4.1.2 Shell 脚本

| 文件名 | 类型 | 路径 | 功能简介 | 执行上下文 |
|---|---|---|---|---|
| `start_agent.sh` | Script | `aiops-build/zabbix/agent/start_agent.sh` | 启动 Zabbix 探针 | 服务器启动时 |
| `stop_agent.sh` | Script | `aiops-build/zabbix/agent/stop_agent.sh` | 停止 Zabbix 探针 | 管理员手动执行 |

### 4.1.3 关键配置文件

| 文件名 | 类型 | 路径 | 作用说明 |
|---|---|---|---|
| `platform.properties` | Config | `aiops-build/config/conf/platform.properties` | 平台基础配置 |
| `jdbc.properties` | Config | `aiops-https-service/config/database/jdbc.properties` | 数据库连接配置 |
| `elasticsearch.properties` | Config | `aiops-https-service/config/elasticsearch/elasticsearch.properties` | Elasticsearch 连接配置 |

### 4.1.4 Kubernetes 部署配置

| 文件名 | 类型 | 路径 | 作用说明 |
|---|---|---|---|
| `start-aiops-service.yaml` | Deployment | `aiops-build/k8s/start-aiops-service.yaml` | AIOps 后端服务部署 |
| `start-aiops-agent.yaml` | DaemonSet | `aiops-build/k8s/start-aiops-agent.yaml` | 探针代理部署 |

---

## 5. 技术栈与版本说明（示例表格）

| 层 | 技术 | 版本 | 证据来源（必须可追溯） |
|---|---|---|---|
| Build | Maven / Gradle | `x.y.z` | `pom.xml` / `build.gradle` |
| Framework | Spring Boot / Quarkus / NestJS 等 | `x.y.z` | 依赖配置位置 |
| DB | MySQL / PostgreSQL | `x.y.z` | 配置文件或依赖定义 |
| Cache/MQ | Redis / Kafka / RabbitMQ | `x.y.z` | starter 与配置项 |

---

## 6. 代码问题与重构建议（示例表格）

| 问题ID | 发现点 | 证据位置 | 影响 | 建议方案 | 优先级 |
|---|---|---|---|---|---|
| R-01 | 工具类职责过载 | `common/utils/xxxUtil.java` | 修改风险大、复用困难 | 拆分单一职责工具并加单测 | 高 |
| R-02 | 重复的 DTO 转换逻辑 | `*/ServiceImpl.java` 多处 | 维护成本高 | 提取统一转换器，替换调用点 | 中 |


