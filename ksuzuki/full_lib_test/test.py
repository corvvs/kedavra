#%%
print('hello')
# %%
import pandas as pd
# %%
df = pd.read_csv('../../../datasets/dataset_train.csv', index_col=0)
# %%
df
# %%
df.describe()
# %%
import matplotlib.pyplot as plt
# %%
df.columns
# %%
data_col = ['Hogwarts House', 'Arithmancy', 'Astronomy', 'Herbology', 'Defense Against the Dark Arts',
       'Divination', 'Muggle Studies', 'Ancient Runes', 'History of Magic',
       'Transfiguration', 'Potions', 'Care of Magical Creatures', 'Charms',
       'Flying']
temp_df = df[data_col]
temp_df
# %%
import seaborn as sns
# %%
# sns.pairplot(df, hue='Hogwarts House')
# %%
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

X = df[['Arithmancy', 'Astronomy', 'Herbology', 'Defense Against the Dark Arts',
       'Divination', 'Muggle Studies', 'Ancient Runes', 'History of Magic',
       'Transfiguration', 'Potions', 'Care of Magical Creatures', 'Charms',
       'Flying']]
Y = df['Hogwarts House'].map({'Ravenclaw': 0, 'Slytherin': 1, 'Gryffindor': 2, 'Hufflepuff': 3})
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size = 0.2, random_state = 0)

lr = LogisticRegression()
lr.fit(X_train, Y_train)
# %%
X
# %%
df.isnull()
# %%
df.isnull().any()
# %%
df2 = df.dropna()
# %%
df2.describe()
# %%
df2.isnull().any()
# %%
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

X = df2[['Arithmancy', 'Astronomy', 'Herbology', 'Defense Against the Dark Arts',
       'Divination', 'Muggle Studies', 'Ancient Runes', 'History of Magic',
       'Transfiguration', 'Potions', 'Care of Magical Creatures', 'Charms',
       'Flying']]
Y = df2['Hogwarts House'].map({'Ravenclaw': 0, 'Slytherin': 1, 'Gryffindor': 2, 'Hufflepuff': 3})
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size = 0.2, random_state = 0)

lr = LogisticRegression()
lr.fit(X_train, Y_train)
# %%
print("coefficient = ", lr.coef_)
print("intercept = ", lr.intercept_)
# %%
Y_pred = lr.predict(X_test)
print(Y_pred)
# %%
from sklearn.metrics import confusion_matrix, accuracy_score, precision_score, recall_score, f1_score

print('confusion matrix = \n', confusion_matrix(y_true=Y_test, y_pred=Y_pred))
print('accuracy = ', accuracy_score(y_true=Y_test, y_pred=Y_pred))
# %%
